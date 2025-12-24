#!/bin/bash
echo "Downloading UCI HAR Dataset..."
curl -L "https://archive.ics.uci.edu/static/public/240/human+activity+recognition+using+smartphones.zip" -o dataset.zip

echo "Unzipping..."
unzip -q dataset.zip
rm dataset.zip

# The zip inside the zip
unzip -q "UCI HAR Dataset.zip"
rm "UCI HAR Dataset.zip"

echo "Dataset ready in 'UCI HAR Dataset/'"
