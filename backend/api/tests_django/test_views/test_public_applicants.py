# api/supabase_utils.py
import tempfile
import os
from supabase import ClientException
from django.core.exceptions import ValidationError
from .supabase_client import supabase

def upload_to_supabase(bucket_name, file_obj, filename):
    """Uploads a file to Supabase storage with proper error handling."""
    if not file_obj:
        raise ValidationError("No file provided for upload")
    
    if not filename:
        raise ValidationError("No filename provided")
    
    path = f"{bucket_name}/{filename}"

    try:
        # Save file temporarily
        with tempfile.NamedTemporaryFile(delete=False) as temp_file:
            for chunk in file_obj.chunks():
                temp_file.write(chunk)
            temp_file_path = temp_file.name

        # Upload to Supabase
        supabase.storage.from_(bucket_name).upload(
            path, 
            temp_file_path,
            {"content-type": file_obj.content_type}
        )

        # Get public URL
        public_url = supabase.storage.from_(bucket_name).get_public_url(path)
        
        return public_url

    except ClientException as e:
        raise ValidationError(f"Supabase upload failed: {str(e)}")
    except Exception as e:
        raise ValidationError(f"File upload failed: {str(e)}")
    finally:
        # Clean up temp file if it exists
        if 'temp_file_path' in locals() and os.path.exists(temp_file_path):
            os.remove(temp_file_path)