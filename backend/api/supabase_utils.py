import tempfile
import os
from .supabase_client import supabase

def upload_to_supabase(bucket_name, file_obj, filename):
    path = f"{bucket_name}/{filename}"

    # احفظ الملف مؤقتًا
    with tempfile.NamedTemporaryFile(delete=False) as temp_file:
        for chunk in file_obj.chunks():
            temp_file.write(chunk)
        temp_file_path = temp_file.name

    # ارفع الملف من المسار
    supabase.storage.from_(bucket_name).upload(path, temp_file_path, {
        "content-type": file_obj.content_type
    })

    # امسح الملف المؤقت
    os.remove(temp_file_path)

    # رجّع الرابط
    return supabase.storage.from_(bucket_name).get_public_url(path)
