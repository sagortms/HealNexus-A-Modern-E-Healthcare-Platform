# healnexus_backend/seed_medical_data.py
import pandas as pd
import os
import sys
import re
from sqlalchemy import text
from core.database import SessionLocal, engine
from models import db_models

# Ensure we're in the right directory for relative imports
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

DATA_DIR = os.path.join(os.path.dirname(__file__), "data")

def clean_text(text_val):
    if pd.isna(text_val) or not str(text_val).strip():
        return None
    return str(text_val).strip()

def clean_generic_name(name):
    """
    Removes strength info like 'Paracetamol (500mg)' -> 'Paracetamol'
    to improve matching across different datasets.
    """
    if not name: return None
    # Remove everything inside parentheses and the parentheses themselves
    name = re.sub(r'\(.*?\)', '', name)
    # Remove trailing strengths like '500mg' or '10mg/5ml'
    name = re.sub(r'\d+\s*(mg|ml|g|mcg|unit|iu)(\/\d+\s*(mg|ml|g|mcg))?', '', name, flags=re.IGNORECASE)
    return name.strip()

def seed_data():
    print("--- 1. DROPPING AND RECREATING TABLES ---")
    db_models.Base.metadata.drop_all(bind=engine)
    db_models.Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    try:
        print("--- 2. LOADING DATASETS ---")
        df_mfr_csv = pd.read_csv(os.path.join(DATA_DIR, "manufacturer.csv"))
        df_gen_csv = pd.read_csv(os.path.join(DATA_DIR, "generic.csv"))
        df_dc_csv = pd.read_csv(os.path.join(DATA_DIR, "drug class.csv"))
        df_df_csv = pd.read_csv(os.path.join(DATA_DIR, "dosage form.csv"))
        df_ind_csv = pd.read_csv(os.path.join(DATA_DIR, "indication.csv"))
        
        # The primary medicine source
        df_medicine_bd = pd.read_csv(os.path.join(DATA_DIR, "medicine.csv"))
        
        # The enrichment source (Lookup only)
        df_details_lookup = pd.read_csv(os.path.join(DATA_DIR, "Medicine_Details.csv"))

        print("--- 3. SEEDING LOOKUP TABLES (Manufacturers, Drug Classes, Forms) ---")
        
        # Manufacturers
        all_mfrs = set(df_mfr_csv['manufacturer name'].dropna().unique())
        all_mfrs.update(df_medicine_bd['manufacturer'].dropna().unique())
        mfr_objs = [db_models.Manufacturer(name=name) for name in all_mfrs if name]
        db.bulk_save_objects(mfr_objs)
        db.commit()
        mfr_map = {m.name: m.id for m in db.query(db_models.Manufacturer).all()}

        # Drug Classes
        all_dcs = set(df_dc_csv['drug class name'].dropna().unique())
        all_dcs.update(df_gen_csv['drug class'].dropna().unique())
        dc_objs = [db_models.DrugClass(name=name) for name in all_dcs if name]
        db.bulk_save_objects(dc_objs)
        db.commit()
        dc_map = {dc.name: dc.id for dc in db.query(db_models.DrugClass).all()}

        # Dosage Forms
        all_dfs = set(df_df_csv['dosage form name'].dropna().unique())
        all_dfs.update(df_medicine_bd['dosage form'].dropna().unique())
        df_objs = [db_models.DosageForm(name=name) for name in all_dfs if name]
        db.bulk_save_objects(df_objs)
        db.commit()
        form_map = {f.name: f.id for f in db.query(db_models.DosageForm).all()}

        # Indications (Initial set)
        all_inds = set(df_ind_csv['indication name'].dropna().unique())
        all_inds.update(df_gen_csv['indication'].dropna().unique())
        ind_objs = [db_models.Indication(name=name) for name in all_inds if name]
        db.bulk_save_objects(ind_objs)
        db.commit()
        # We will refresh the ind_map later as we add more from the lookup

        print("--- 4. SEEDING GENERICS ---")
        # Initialize Generics from generic.csv
        unique_generics = set(df_gen_csv['generic name'].dropna().unique())
        unique_generics.update(df_medicine_bd['generic'].dropna().unique())
        
        gen_objs = [db_models.Generic(name=name) for name in unique_generics if name]
        db.bulk_save_objects(gen_objs)
        db.commit()
        
        # Map for lookup
        # We use a normalized key (lowercase, no strength) to match with Medicine_Details
        generics_in_db = db.query(db_models.Generic).all()
        gen_name_map = {g.name: g for g in generics_in_db}
        gen_norm_map = {clean_generic_name(g.name).lower(): g for g in generics_in_db if clean_generic_name(g.name)}

        print("--- 5. ENRICHING GENERICS FROM LOOKUP (Medicine_Details.csv) ---")
        # Refresh indication map
        ind_map = {i.name: i.id for i in db.query(db_models.Indication).all()}
        
        # Use Medicine_Details to update side_effects and link indications
        for _, row in df_details_lookup.iterrows():
            comp_name = clean_generic_name(row['Composition'])
            if not comp_name: continue
            
            generic_obj = gen_norm_map.get(comp_name.lower())
            if generic_obj:
                # Update Side Effects
                if pd.notna(row['Side_effects']) and not generic_obj.side_effects:
                    generic_obj.side_effects = str(row['Side_effects']).strip()
                
                # Link Indications (Uses)
                if pd.notna(row['Uses']):
                    # Split 'Uses' - heuristic: split by common patterns or just treat as one if no commas
                    # For Medicine_Details, uses are often space combined like "Fever Headache"
                    # We'll try splitting by comma, then take the whole thing if no commas
                    raw_uses = str(row['Uses']).strip()
                    uses_list = [u.strip() for u in raw_uses.split(',')] if ',' in raw_uses else [raw_uses]
                    
                    for use_name in uses_list:
                        if len(use_name) < 3: continue
                        
                        # Find or create Indication (CASE-INSENSITIVE CHECK)
                        existing_ind_id = ind_map.get(use_name)
                        if not existing_ind_id:
                            # Try a second lookup for different casing if needed, but dict is already populated
                            # Let's just create if definitely not in map
                            new_ind = db_models.Indication(name=use_name)
                            db.add(new_ind)
                            try:
                                db.flush() # Get ID
                                ind_map[use_name] = new_ind.id
                                existing_ind_id = new_ind.id
                            except:
                                db.rollback()
                                # It might have been added by another row in this loop or already exists
                                # Re-fetch ID
                                actual = db.query(db_models.Indication).filter(db_models.Indication.name == use_name).first()
                                if actual:
                                    ind_map[use_name] = actual.id
                                    existing_ind_id = actual.id
                        
                        if existing_ind_id:
                            # Link via association table
                            db.execute(db_models.generic_indication_association.insert().prefix_with("IGNORE").values(
                                generic_id=generic_obj.id, 
                                indication_id=existing_ind_id
                            ))
        db.commit()

        print("--- 6. POPULATING MEDICINES (From medicine.csv ONLY) ---")
        # Map for Generic IDs (Standard names)
        final_gen_map = {g.name: g.id for g in db.query(db_models.Generic).all()}
        
        # Map for Generic -> Drug Class (from generic.csv)
        gen_to_dc_map = {}
        for _, row in df_gen_csv.iterrows():
            g_name = clean_text(row['generic name'])
            dc_name = clean_text(row['drug class'])
            if g_name and dc_name:
                gen_to_dc_map[g_name] = dc_map.get(dc_name)

        medicines_to_seed = []
        # medicine.csv columns: brand id, brand name, type, slug, dosage form, generic, strength, manufacturer, package container, Package Size
        for _, row in df_medicine_bd.iterrows():
            brand_name = clean_text(row['brand name'])
            if not brand_name: continue
            
            gen_name = clean_text(row['generic'])
            gen_id = final_gen_map.get(gen_name)
            mfr_id = mfr_map.get(clean_text(row['manufacturer']))
            df_id = form_map.get(clean_text(row['dosage form']))
            dc_id = gen_to_dc_map.get(gen_name)
            
            # Extract price from package container if present
            price_val = None
            pkg = str(row['package container'])
            if "à§³" in pkg:
                price_val = pkg.split("à§³")[-1].strip()

            medicines_to_seed.append(db_models.Medicine(
                brand_name=brand_name,
                strength=clean_text(row['strength']),
                price=price_val,
                manufacturer_id=mfr_id,
                generic_id=gen_id,
                drug_class_id=dc_id,
                dosage_form_id=df_id
            ))

            if len(medicines_to_seed) >= 2000:
                db.bulk_save_objects(medicines_to_seed)
                db.commit()
                medicines_to_seed = []

        if medicines_to_seed:
            db.bulk_save_objects(medicines_to_seed)
            db.commit()

        print("--- SEEDING COMPLETE ---")

    except Exception as e:
        db.rollback()
        print(f"FATAL ERROR during seeding: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    seed_data()
