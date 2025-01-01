use std::fs::{self, File};
use std::io::Write;
use tauri::{Manager};
use std::error::Error;
use std::path::{PathBuf};
use directories::UserDirs; // directories crate'ini kullanıyoruz

// Belgeler klasöründe bir dosya oluştur
#[tauri::command]
fn create_exe_file() -> Result<String, String> {
    let user_dirs = UserDirs::new().ok_or("Could not locate user directories")?;
    let documents_dir = user_dirs.document_dir().ok_or("Could not locate Documents directory")?;
    let file_path = documents_dir.join("01101101 01100101 01110010 01101000 01100001 01100010 01100001 00100000 01100100 01110101 01101110 01111001 01100001.exe");

    let mut file = File::create(&file_path).map_err(|e| e.to_string())?;
    file.write_all(b"Binary content of 'merhaba dunya'").map_err(|e| e.to_string())?;

    Ok(file_path.to_string_lossy().to_string())
}

// Belgeler klasöründe dosya adını kontrol et
#[tauri::command]
fn check_file_name() -> Result<bool, String> {
    let user_dirs: UserDirs = UserDirs::new().ok_or("Could not locate user directories")?;
    let documents_dir = user_dirs.document_dir().ok_or("Could not locate Documents directory")?;
    let target_file = documents_dir.join("merhaba dunya.exe");

    if target_file.exists() {
        Ok(true)
    } else {
        Ok(false)
    }
}

#[tauri::command]
fn is_dev_mode() -> bool {
    cfg!(debug_assertions)
}

#[tauri::command]
async fn copy_image() -> Result<String, String> {
    use std::fs;

    // Define the source file path
    let source_path = PathBuf::from(r"C:\Program Files\escape-game\_up_\public\images\sys.png");

    // Check if the source file exists
    if !source_path.exists() {
        return Err("Source image file does not exist".to_string());
    }

    // Define the destination path in the user's Documents directory
    let user_dirs = UserDirs::new().ok_or("Could not locate user directories")?;
    let documents_dir = user_dirs.document_dir().ok_or("Could not locate Documents directory")?;
    let destination_path = documents_dir.join("sys.png");

    // Copy the file
    fs::copy(&source_path, &destination_path)
        .map_err(|e| e.to_string())?;

    Ok(format!("Image copied to {:?}", destination_path))
}



fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![create_exe_file, check_file_name, copy_image, is_dev_mode])
        .run(tauri::generate_context!())
        .expect("error while running Tauri application");
}
