# Barcode Manager Desktop

A professional desktop barcode management application built with **Electron**, **React**, **Vite**, **Tailwind CSS**, and **JSON storage**. Create, manage, and export barcodes with support for 70+ barcode types including linear, 2D, postal, and specialty formats.

![Barcode Manager Screenshot](https://via.placeholder.com/800x500/f8fafc/1e293b?text=Barcode+Manager+Desktop+App)

## 🚀 Features

- **Modern UI**: Clean, responsive interface built with React and Tailwind CSS
- **70+ Barcode Types**: Support for linear (Code128, Code39, EAN13, UPC-A), 2D (QR, Data Matrix, PDF417), postal, and specialty barcodes
- **Local Database**: Persistent JSON storage for all your products and barcodes
- **Smart Search**: Search products by description, SKU, or barcode value
- **PNG Export**: Export barcodes as high-quality PNG images
- **Duplicate Detection**: Automatically prevents duplicate products by SKU or description
- **Cross-Platform**: Runs on Windows, macOS, and Linux
- **Secure**: Uses Electron's security best practices with context isolation

## 📋 Prerequisites

- **Node.js** 18 or higher
- **npm** (comes with Node.js)
- **Git** (optional, for cloning)

## 🛠️ Installation

1. **Clone or download** the project:
   ```bash
   git clone <repository-url> barcode-desktop
   cd barcode-desktop
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

## 🏃‍♂️ Development

Start the development server:
```bash
npm run dev
```

This will:
- Start the Vite development server for the React renderer
- Launch Electron with hot reload enabled
- Open developer tools for debugging

## 🔨 Building

### Development Build
```bash
npm run build
```

### Distribution Packages
```bash
npm run dist
```

This creates installers for your platform:
- **Windows**: `.exe` installer (NSIS)
- **macOS**: `.dmg` disk image
- **Linux**: `.AppImage` portable executable

## 📁 Project Structure

```
barcode-desktop/
├─ package.json          # Dependencies and scripts
├─ vite.config.js        # Vite bundler configuration
├─ tailwind.config.cjs   # Tailwind CSS configuration
├─ postcss.config.cjs    # PostCSS configuration
├─ public/
│  └─ index.html         # Main HTML template
├─ src-electron/
│  ├─ main.js           # Electron main process
│  └─ preload.js        # Secure IPC bridge
├─ src-renderer/
│  ├─ main.jsx          # React application entry
│  ├─ App.jsx           # Main React component
│  ├─ styles.css        # Global styles with Tailwind
│  └─ components/
│     ├─ ProductForm.jsx    # Add/edit product form
│     ├─ ProductList.jsx    # Product search and list
│     └─ BarcodeViewer.jsx  # Barcode preview and export
└─ db/
   └─ migrations.sql    # Database schema
```

## 🎯 How to Use

### Adding Products

1. **Enter a product description** (required)
2. **Add an SKU** (optional but recommended)
3. **Select barcode type** from the dropdown
4. **Custom barcode value** (optional - defaults to `PRD00000001` format)
5. Click **"Add / Get Barcode"**

### Managing Products

- **Search**: Use the search box to find products by description, SKU, or barcode
- **View Details**: Click any product in the list to see its barcode preview
- **Export PNG**: Select a product and click "Export PNG" to save the barcode image

### Barcode Types Supported

- **Code128** - High-density linear barcode (default)
- **Code39** - Alphanumeric barcode
- **EAN13** - European Article Number (13 digits)
- **EAN8** - Shorter European Article Number (8 digits)
- **UPC-A** - Universal Product Code
- **UPC-E** - Compressed UPC format
- **ITF14** - Interleaved 2 of 5 (14 digits)
- **PDF417** - 2D stacked barcode
- **QR** - QR Code (2D matrix)
- **Aztec** - Aztec Code (2D matrix)

## 🔧 Configuration

### Database Location
The SQLite database is stored in your system's user data directory:
- **Windows**: `%APPDATA%\barcode-desktop\barcodes.db`
- **macOS**: `~/Library/Application Support/barcode-desktop/barcodes.db`
- **Linux**: `~/.config/barcode-desktop/barcodes.db`

### Exported Images
PNG files are saved to:
- **Windows**: `%APPDATA%\barcode-desktop\images\`
- **macOS**: `~/Library/Application Support/barcode-desktop/images/`
- **Linux**: `~/.config/barcode-desktop/images/`

## 🛡️ Security

This application follows Electron security best practices:
- **Context Isolation**: Renderer process is isolated from Node.js
- **Preload Scripts**: Secure IPC communication via contextBridge
- **No Node Integration**: Renderer cannot directly access Node.js APIs
- **Content Security**: SQL injection prevention with parameterized queries

## 🐛 Troubleshooting

### Common Issues

**"Cannot find module 'sqlite3'"**
- Run `npm install` to ensure all dependencies are installed
- For Windows: Ensure you have Visual Studio Build Tools installed

**"Permission denied" when exporting**
- Check that the application has write permissions to the user data directory
- Try running as administrator (Windows) or with appropriate permissions

**Barcode not rendering**
- Verify the barcode text contains valid characters for the selected type
- Check browser console for specific error messages

### Development Issues

**Vite server not starting**
- Check that port 5173 is available
- Clear npm cache: `npm cache clean --force`

**Electron not launching**
- Verify Node.js version (18+)
- Check console output for specific error messages

## 📝 API Reference

The application exposes these IPC methods via `window.api`:

```javascript
// Add a new product (returns existing if duplicate found)
await window.api.addProduct({
  description: "Product Name",
  sku: "ABC123",
  barcodeType: "code128",
  customBarcode: "CUSTOM123" // optional
})

// Search products
await window.api.search("search query")

// Get single product by ID
await window.api.getProduct(123)

// Export barcode as PNG
await window.api.saveImageToDisk({
  base64: "data:image/png;base64,...",
  suggestedName: "barcode.png"
})

// Show save dialog
await window.api.showSaveDialog({ defaultName: "barcode.png" })

// Update product image path
await window.api.updateImagePath({ id: 123, imagePath: "/path/to/image" })

// Get available barcode types
await window.api.listBarcodeTypes()
```

## 🔄 Future Enhancements

- **Batch Import**: CSV import for bulk product creation
- **Print Integration**: Direct printing to label printers
- **Templates**: Predefined label templates (Avery, etc.)
- **Categories**: Product categorization and filtering
- **Export Formats**: PDF, SVG export options
- **Multi-user**: User accounts and permissions
- **Cloud Sync**: Optional cloud backup and synchronization

## 📄 License

MIT License - see LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📞 Support

For issues and questions:
- Check the [troubleshooting section](#-troubleshooting) above
- Create an issue in the project repository
- Review existing documentation

---

**Built with ❤️ using Electron, React, and modern web technologies**