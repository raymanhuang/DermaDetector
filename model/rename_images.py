import os
import time

# Base directory
base_path = r"C:\Users\imara\Downloads\archive\skin_diseases"

# Training and testing directories
base_dirs = [os.path.join(base_path, 'train'), os.path.join(base_path, 'test')]

# Sub-directories/classes
sub_dirs = ['1.Eczema', '2.Acne', '3.Pigment', '4.Benign', '5.Malign']

# Get the current timestamp
timestamp = str(int(time.time()))

# Iterate through each base directory
for base_dir in base_dirs:

    # Iterate through each sub-directory
    for sub_dir in sub_dirs:
        full_path = os.path.join(base_dir, sub_dir)

        # Ensure the path exists
        if os.path.exists(full_path):

            # List all image files in the directory (assuming .jpg, .jpeg, .png extensions for images)
            img_files = [f for f in os.listdir(full_path) if f.endswith(('.jpg', '.jpeg', '.png'))]

            # Rename each image file
            for idx, img_file in enumerate(img_files, start=1):
                # Extract the current file's extension and create a new name
                file_extension = os.path.splitext(img_file)[1]
                new_name = f"{sub_dir}_{idx}_{timestamp}{file_extension}"  # e.g., "1.Eczema_1_1632319876.jpg"

                # Rename the file
                os.rename(os.path.join(full_path, img_file), os.path.join(full_path, new_name))

print("Renaming completed!")