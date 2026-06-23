use tauri::Manager;

#[tauri::command]
fn get_app_version() -> String {
    "1.1.0".to_string()
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![get_app_version])
        .setup(|app| {
            let window = app.get_webview_window("main").unwrap();
            window.set_title("Sudokue").ok();
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
