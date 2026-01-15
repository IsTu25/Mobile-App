import requests
import zipfile
import io
import os

URL = "https://archive.ics.uci.edu/static/public/240/human+activity+recognition+using+smartphones.zip"

def download_and_extract():
    print(f"Downloading from {URL}...")
    r = requests.get(URL)
    r.raise_for_status()
    print("Download complete. Extracting...")
    
    with zipfile.ZipFile(io.BytesIO(r.content)) as z:
        z.extractall(".")
        
    # The inner zip
    if os.path.exists("UCI HAR Dataset.zip"):
        print("Extracting inner zip...")
        with zipfile.ZipFile("UCI HAR Dataset.zip") as z:
            z.extractall(".")
        os.remove("UCI HAR Dataset.zip")
        
    print("Done!")

if __name__ == "__main__":
    download_and_extract()
