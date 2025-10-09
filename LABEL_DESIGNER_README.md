# 📋 Barcode Manager - Label Designer

## Overview
The Label Designer is a comprehensive tool for creating customizable thermal printer labels with barcodes, QR codes, logos, and custom fields. It supports various label templates and paper sizes optimized for thermal printers.

## Features

### 🎨 Template System
- **Standard Template**: Basic product labels with essential fields
- **Warehouse Template**: Inventory management labels with location, batch, and quantity fields
- **Retail Template**: Customer-facing labels with price, description, and promotional fields
- **Pharmaceutical Template**: Medical product labels with lot numbers, expiry dates, and regulatory info
- **Food Template**: Food product labels with nutritional info, allergens, and expiry dates
- **Shipping Template**: Logistics labels with tracking, destination, and weight information
- **Asset Management**: Equipment tracking labels with maintenance and location data

### 📏 Paper Size Support
- **4" × 3"** (101.6 × 76.2 mm) - Most common thermal label
- **4" × 2"** (101.6 × 50.8 mm) - Shipping labels
- **4" × 6"** (101.6 × 152.4 mm) - Large shipping labels
- **2" × 1"** (50.8 × 25.4 mm) - Small product labels
- **3" × 1"** (76.2 × 25.4 mm) - Medium product labels
- **Custom sizes** - Adjustable width and height

### 🏷️ Barcode Support
- **Linear Barcodes**: Code 128, Code 39, EAN-13, UPC-A, ITF-14
- **2D Codes**: QR Code, Data Matrix
- **Automatic validation** and format correction
- **Industry-specific** barcode recommendations per template

### 🖼️ Design Elements
- **Logo Upload**: PNG, JPG, GIF, WebP support with auto-resizing
- **Custom Fields**: Unlimited additional data fields
- **Typography**: Professional fonts and sizing
- **Layout**: Automatic positioning and spacing optimization

### 🖨️ Thermal Printer Optimization
- **Resolution**: 203-300 DPI support
- **Paper Width**: 20-120mm (0.78"-4.72")
- **Label Length**: 10-2286mm (0.39"-90")
- **Format**: High-resolution PNG export for thermal printers
- **Print Preview**: Accurate WYSIWYG preview

## Usage Guide

### 1. Select Template
1. Open the **Label Designer** tab
2. Choose from predefined templates in the dropdown
3. Templates automatically configure:
   - Optimal paper size
   - Relevant custom fields
   - Industry-appropriate barcode types
   - Professional layout

### 2. Configure Label Content
- **Title**: Main product name or identifier
- **Subtitle**: Additional description (optional)
- **Barcode**: Primary identification code
- **QR Code**: Secondary data or URL (optional)
- **Logo**: Company or brand logo upload

### 3. Add Custom Fields
- Click **"+ Add Field"** to create new data fields
- Set field labels (e.g., "SKU:", "Price:", "Batch:")
- Enter field values
- Remove unwanted fields with the **×** button

### 4. Adjust Paper Size
- Select from standard thermal printer sizes
- Or manually adjust width/height for custom sizes
- Preview updates automatically

### 5. Export and Print
- **Export PNG**: Save high-resolution file for later printing
- **Print Label**: Open print dialog optimized for thermal printers

## Template Details

### Standard Template
- **Use Case**: General purpose labeling
- **Fields**: Product name, basic details
- **Size**: 4" × 3"
- **Barcode**: Code 128

### Warehouse Template
- **Use Case**: Inventory management
- **Fields**: Location, batch number, quantity per case/pallet
- **Size**: 4" × 3"
- **Barcode**: Code 39 (warehouse standard)

### Retail Template
- **Use Case**: Customer-facing products
- **Fields**: Price, description, promotion info
- **Size**: 3" × 1" (compact)
- **Barcode**: EAN-13/UPC-A (retail standard)

### Pharmaceutical Template
- **Use Case**: Medical/pharmaceutical products
- **Fields**: Lot number, expiry date, dosage, regulatory info
- **Size**: 4" × 2"
- **Barcode**: Code 128 (pharmaceutical standard)

### Food Template
- **Use Case**: Food and beverage products
- **Fields**: Ingredients, allergens, nutrition facts, expiry
- **Size**: 4" × 3"
- **Barcode**: EAN-13 (food industry standard)

### Shipping Template
- **Use Case**: Logistics and shipping
- **Fields**: Tracking number, destination, weight, carrier
- **Size**: 4" × 6" (shipping label standard)
- **Barcode**: Code 128 (logistics standard)

### Asset Management Template
- **Use Case**: Equipment and asset tracking
- **Fields**: Asset ID, maintenance date, location, condition
- **Size**: 2" × 1" (equipment tag size)
- **Barcode**: Code 39 (asset management standard)

## Technical Specifications

### Supported Image Formats
- PNG (recommended for thermal printers)
- JPG/JPEG
- GIF
- WebP
- SVG (converted to raster)

### Printer Compatibility
- **Zebra**: ZT410, ZT420, GK420d, GX420d
- **Dymo**: LabelWriter 450, 4XL
- **Brother**: QL-800, QL-1100
- **Citizen**: CL-S700, CL-E300
- **TSC**: TTP-244 Pro, TE200
- **Generic thermal printers** supporting PNG format

### Export Specifications
- **Format**: PNG (24-bit color)
- **Resolution**: Scalable 100-300 DPI
- **Color**: Full color with automatic B&W conversion option
- **Compression**: Optimized for file size and print quality

## Best Practices

### Label Design
1. **Keep text readable**: Use appropriate font sizes for label dimensions
2. **Maintain contrast**: Dark text on light backgrounds for thermal printing
3. **Logo placement**: Position logos to not interfere with barcodes
4. **Field organization**: Group related information logically
5. **Barcode placement**: Keep barcodes in easily scannable areas

### Thermal Printing
1. **Test print settings**: Verify DPI and size settings before bulk printing
2. **Use quality media**: Thermal paper quality affects print durability
3. **Printer maintenance**: Clean printheads regularly for optimal quality
4. **Temperature settings**: Adjust printer temperature for paper type

### Data Management
1. **Consistent formatting**: Use standard formats for dates, SKUs, etc.
2. **Validation**: Verify barcode data before printing
3. **Template standardization**: Use consistent templates within organization
4. **Backup labels**: Save label configurations for reprinting

## Integration

### Database Integration
- Labels automatically populate from product database
- SKU and barcode data sync with inventory system
- Custom fields can reference database columns

### API Endpoints (Future)
- Export label designs as JSON
- Import templates from external sources
- Batch label generation from CSV/Excel

## Troubleshooting

### Common Issues

#### Blank Labels
- **Cause**: Incorrect paper size or DPI settings
- **Solution**: Verify paper size matches printer configuration

#### Barcode Scanning Issues
- **Cause**: Low resolution or incorrect barcode type
- **Solution**: Use 203+ DPI and appropriate barcode format

#### Logo Display Problems
- **Cause**: Unsupported image format or size
- **Solution**: Convert to PNG and resize to max 200×200 pixels

#### Print Quality Issues
- **Cause**: Printer head temperature or speed settings
- **Solution**: Adjust printer settings or clean print head

### Support
For technical support or feature requests:
1. Check application console for error messages
2. Verify thermal printer drivers are installed
3. Test with standard templates before custom designs
4. Contact support with label configuration and error logs

---

*Barcode Manager v1.0.0 - Professional Label Designer*