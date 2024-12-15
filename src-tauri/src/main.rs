use std::fs::{self, File};
use std::io::Write;
use tauri::Manager;
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
    let user_dirs = UserDirs::new().ok_or("Could not locate user directories")?;
    let documents_dir = user_dirs.document_dir().ok_or("Could not locate Documents directory")?;
    let target_file = documents_dir.join("merhaba dunya.exe");

    if target_file.exists() {
        Ok(true)
    } else {
        Ok(false)
    }
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![create_exe_file, check_file_name])
        .run(tauri::generate_context!())
        .expect("error while running Tauri application");
}
