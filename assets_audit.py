import os
import re

def get_files_recursively(directory):
    file_paths = []
    for root, _, files in os.walk(directory):
        for file in files:
            if file == '.DS_Store': continue
            file_paths.append(os.path.join(root, file))
    return file_paths

def check_unused_assets():
    assets_dir = 'src/assets'
    public_dir = 'public'
    src_dir = 'src'
    
    asset_files = get_files_recursively(assets_dir)
    public_files = get_files_recursively(public_dir)
    
    all_assets = asset_files + public_files
    used_assets = set()
    
    print(f"Scanning {len(all_assets)} assets...")
    
    for root, _, files in os.walk(src_dir):
        for file in files:
            if not file.endswith(('.js', '.jsx', '.css', '.html')): continue
            
            filepath = os.path.join(root, file)
            with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()
                
                for asset in all_assets:
                    basename = os.path.basename(asset)
                    # Check for simple filename usage
                    if basename in content:
                        used_assets.add(asset)
                        
    unused_assets = [f for f in all_assets if f not in used_assets]
    
    print(f"\nFound {len(unused_assets)} potentially unused assets:")
    for asset in unused_assets:
        print(f"- {asset}")

if __name__ == "__main__":
    check_unused_assets()
