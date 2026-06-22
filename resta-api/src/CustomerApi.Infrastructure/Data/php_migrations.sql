SET NOCOUNT ON;
-- Generated from Laravel PHP migrations

-- MIGRATION: 2014_10_12_000000_create_users_table
IF NOT EXISTS (SELECT 1 FROM [SchemaMigration] WHERE [MigrationName] = N'2014_10_12_000000_create_users_table')
BEGIN
  IF OBJECT_ID(N'dbo.[User]', N'U') IS NULL
  BEGIN
  CREATE TABLE dbo.[User] (
    [Id] INT IDENTITY(1,1) NOT NULL,
    [Name] NVARCHAR(191) NOT NULL,
    [Email] NVARCHAR(191) NOT NULL,
    [Password] NVARCHAR(191) NOT NULL,
    [CreatedDate] DATETIME2 NULL,
    [ModifiedDate] DATETIME2 NULL
  );
  ALTER TABLE dbo.[User] ADD CONSTRAINT PK_User PRIMARY KEY ([Id]);
  IF NOT EXISTS (SELECT 1 FROM sys.default_constraints WHERE name = N'DF_User_CreatedDate')
    ALTER TABLE dbo.[User] ADD CONSTRAINT DF_User_CreatedDate DEFAULT GETDATE() FOR [CreatedDate];
  IF NOT EXISTS (SELECT 1 FROM sys.default_constraints WHERE name = N'DF_User_ModifiedDate')
    ALTER TABLE dbo.[User] ADD CONSTRAINT DF_User_ModifiedDate DEFAULT GETDATE() FOR [ModifiedDate];
  END
  INSERT INTO [SchemaMigration] ([MigrationName], [Batch]) VALUES (N'2014_10_12_000000_create_users_table', 1);
END
GO

-- MIGRATION: 2014_10_12_100000_create_password_resets_table
IF NOT EXISTS (SELECT 1 FROM [SchemaMigration] WHERE [MigrationName] = N'2014_10_12_100000_create_password_resets_table')
BEGIN
  IF OBJECT_ID(N'dbo.[PasswordReset]', N'U') IS NULL
  BEGIN
  CREATE TABLE dbo.[PasswordReset] (
    [Email] NVARCHAR(191) NOT NULL,
    [Token] NVARCHAR(191) NOT NULL,
    [CreatedDate] DATETIME2 NULL
  );
  IF NOT EXISTS (SELECT 1 FROM sys.default_constraints WHERE name = N'DF_PasswordReset_CreatedDate')
    ALTER TABLE dbo.[PasswordReset] ADD CONSTRAINT DF_PasswordReset_CreatedDate DEFAULT GETDATE() FOR [CreatedDate];
  END
  INSERT INTO [SchemaMigration] ([MigrationName], [Batch]) VALUES (N'2014_10_12_100000_create_password_resets_table', 2);
END
GO

-- MIGRATION: 2018_02_17_060412_create_categories_table
IF NOT EXISTS (SELECT 1 FROM [SchemaMigration] WHERE [MigrationName] = N'2018_02_17_060412_create_categories_table')
BEGIN
  IF OBJECT_ID(N'dbo.[Category]', N'U') IS NULL
  BEGIN
  CREATE TABLE dbo.[Category] (
    [Id] INT IDENTITY(1,1) NOT NULL,
    [Name] NVARCHAR(191) NOT NULL,
    [ParentId] INT NULL,
    [IsActive] BIT NULL,
    [CreatedDate] DATETIME2 NULL,
    [ModifiedDate] DATETIME2 NULL
  );
  ALTER TABLE dbo.[Category] ADD CONSTRAINT PK_Category PRIMARY KEY ([Id]);
  IF NOT EXISTS (SELECT 1 FROM sys.default_constraints WHERE name = N'DF_Category_CreatedDate')
    ALTER TABLE dbo.[Category] ADD CONSTRAINT DF_Category_CreatedDate DEFAULT GETDATE() FOR [CreatedDate];
  IF NOT EXISTS (SELECT 1 FROM sys.default_constraints WHERE name = N'DF_Category_ModifiedDate')
    ALTER TABLE dbo.[Category] ADD CONSTRAINT DF_Category_ModifiedDate DEFAULT GETDATE() FOR [ModifiedDate];
  END
  INSERT INTO [SchemaMigration] ([MigrationName], [Batch]) VALUES (N'2018_02_17_060412_create_categories_table', 3);
END
GO

-- MIGRATION: 2018_02_20_035727_create_brands_table
IF NOT EXISTS (SELECT 1 FROM [SchemaMigration] WHERE [MigrationName] = N'2018_02_20_035727_create_brands_table')
BEGIN
  IF OBJECT_ID(N'dbo.[Brand]', N'U') IS NULL
  BEGIN
  CREATE TABLE dbo.[Brand] (
    [Id] INT IDENTITY(1,1) NOT NULL,
    [Title] NVARCHAR(191) NOT NULL,
    [Image] NVARCHAR(191) NULL,
    [IsActive] BIT NULL,
    [CreatedDate] DATETIME2 NULL,
    [ModifiedDate] DATETIME2 NULL
  );
  ALTER TABLE dbo.[Brand] ADD CONSTRAINT PK_Brand PRIMARY KEY ([Id]);
  IF NOT EXISTS (SELECT 1 FROM sys.default_constraints WHERE name = N'DF_Brand_CreatedDate')
    ALTER TABLE dbo.[Brand] ADD CONSTRAINT DF_Brand_CreatedDate DEFAULT GETDATE() FOR [CreatedDate];
  IF NOT EXISTS (SELECT 1 FROM sys.default_constraints WHERE name = N'DF_Brand_ModifiedDate')
    ALTER TABLE dbo.[Brand] ADD CONSTRAINT DF_Brand_ModifiedDate DEFAULT GETDATE() FOR [ModifiedDate];
  END
  INSERT INTO [SchemaMigration] ([MigrationName], [Batch]) VALUES (N'2018_02_20_035727_create_brands_table', 4);
END
GO

-- MIGRATION: 2018_02_25_100635_create_suppliers_table
IF NOT EXISTS (SELECT 1 FROM [SchemaMigration] WHERE [MigrationName] = N'2018_02_25_100635_create_suppliers_table')
BEGIN
  IF OBJECT_ID(N'dbo.[Supplier]', N'U') IS NULL
  BEGIN
  CREATE TABLE dbo.[Supplier] (
    [Id] INT IDENTITY(1,1) NOT NULL,
    [Name] NVARCHAR(191) NOT NULL,
    [Image] NVARCHAR(191) NULL,
    [CompanyName] NVARCHAR(191) NOT NULL,
    [VatNumber] NVARCHAR(191) NULL,
    [Email] NVARCHAR(191) NOT NULL,
    [PhoneNumber] NVARCHAR(191) NOT NULL,
    [Address] NVARCHAR(191) NOT NULL,
    [City] NVARCHAR(191) NOT NULL,
    [State] NVARCHAR(191) NULL,
    [PostalCode] NVARCHAR(191) NULL,
    [Country] NVARCHAR(191) NULL,
    [IsActive] BIT NULL,
    [CreatedDate] DATETIME2 NULL,
    [ModifiedDate] DATETIME2 NULL
  );
  ALTER TABLE dbo.[Supplier] ADD CONSTRAINT PK_Supplier PRIMARY KEY ([Id]);
  IF NOT EXISTS (SELECT 1 FROM sys.default_constraints WHERE name = N'DF_Supplier_CreatedDate')
    ALTER TABLE dbo.[Supplier] ADD CONSTRAINT DF_Supplier_CreatedDate DEFAULT GETDATE() FOR [CreatedDate];
  IF NOT EXISTS (SELECT 1 FROM sys.default_constraints WHERE name = N'DF_Supplier_ModifiedDate')
    ALTER TABLE dbo.[Supplier] ADD CONSTRAINT DF_Supplier_ModifiedDate DEFAULT GETDATE() FOR [ModifiedDate];
  END
  INSERT INTO [SchemaMigration] ([MigrationName], [Batch]) VALUES (N'2018_02_25_100635_create_suppliers_table', 5);
END
GO

-- MIGRATION: 2018_02_27_101619_create_warehouse_table
IF NOT EXISTS (SELECT 1 FROM [SchemaMigration] WHERE [MigrationName] = N'2018_02_27_101619_create_warehouse_table')
BEGIN
  IF OBJECT_ID(N'dbo.[Warehouse]', N'U') IS NULL
  BEGIN
  CREATE TABLE dbo.[Warehouse] (
    [Id] INT IDENTITY(1,1) NOT NULL,
    [Name] NVARCHAR(191) NOT NULL,
    [Phone] NVARCHAR(191) NULL,
    [Email] NVARCHAR(191) NULL,
    [Address] NVARCHAR(MAX) NOT NULL,
    [IsActive] BIT NULL,
    [CreatedDate] DATETIME2 NULL,
    [ModifiedDate] DATETIME2 NULL
  );
  ALTER TABLE dbo.[Warehouse] ADD CONSTRAINT PK_Warehouse PRIMARY KEY ([Id]);
  IF NOT EXISTS (SELECT 1 FROM sys.default_constraints WHERE name = N'DF_Warehouse_CreatedDate')
    ALTER TABLE dbo.[Warehouse] ADD CONSTRAINT DF_Warehouse_CreatedDate DEFAULT GETDATE() FOR [CreatedDate];
  IF NOT EXISTS (SELECT 1 FROM sys.default_constraints WHERE name = N'DF_Warehouse_ModifiedDate')
    ALTER TABLE dbo.[Warehouse] ADD CONSTRAINT DF_Warehouse_ModifiedDate DEFAULT GETDATE() FOR [ModifiedDate];
  END
  INSERT INTO [SchemaMigration] ([MigrationName], [Batch]) VALUES (N'2018_02_27_101619_create_warehouse_table', 6);
END
GO

-- MIGRATION: 2018_03_03_040448_create_units_table
IF NOT EXISTS (SELECT 1 FROM [SchemaMigration] WHERE [MigrationName] = N'2018_03_03_040448_create_units_table')
BEGIN
  IF OBJECT_ID(N'dbo.[ProductUnit]', N'U') IS NULL
  BEGIN
  CREATE TABLE dbo.[ProductUnit] (
    [Id] INT IDENTITY(1,1) NOT NULL,
    [UnitCode] NVARCHAR(191) NOT NULL,
    [UnitName] NVARCHAR(191) NOT NULL,
    [BaseUnit] INT NULL,
    [Operator] NVARCHAR(191) NULL,
    [OperationValue] FLOAT NULL,
    [IsActive] BIT NULL,
    [CreatedDate] DATETIME2 NULL,
    [ModifiedDate] DATETIME2 NULL
  );
  ALTER TABLE dbo.[ProductUnit] ADD CONSTRAINT PK_ProductUnit PRIMARY KEY ([Id]);
  IF NOT EXISTS (SELECT 1 FROM sys.default_constraints WHERE name = N'DF_ProductUnit_CreatedDate')
    ALTER TABLE dbo.[ProductUnit] ADD CONSTRAINT DF_ProductUnit_CreatedDate DEFAULT GETDATE() FOR [CreatedDate];
  IF NOT EXISTS (SELECT 1 FROM sys.default_constraints WHERE name = N'DF_ProductUnit_ModifiedDate')
    ALTER TABLE dbo.[ProductUnit] ADD CONSTRAINT DF_ProductUnit_ModifiedDate DEFAULT GETDATE() FOR [ModifiedDate];
  END
  INSERT INTO [SchemaMigration] ([MigrationName], [Batch]) VALUES (N'2018_03_03_040448_create_units_table', 7);
END
GO

-- MIGRATION: 2018_03_04_041317_create_taxes_table
IF NOT EXISTS (SELECT 1 FROM [SchemaMigration] WHERE [MigrationName] = N'2018_03_04_041317_create_taxes_table')
BEGIN
  IF OBJECT_ID(N'dbo.[Tax]', N'U') IS NULL
  BEGIN
  CREATE TABLE dbo.[Tax] (
    [Id] INT IDENTITY(1,1) NOT NULL,
    [Name] NVARCHAR(191) NOT NULL,
    [Rate] FLOAT NOT NULL,
    [IsActive] BIT NULL,
    [CreatedDate] DATETIME2 NULL,
    [ModifiedDate] DATETIME2 NULL
  );
  ALTER TABLE dbo.[Tax] ADD CONSTRAINT PK_Tax PRIMARY KEY ([Id]);
  IF NOT EXISTS (SELECT 1 FROM sys.default_constraints WHERE name = N'DF_Tax_CreatedDate')
    ALTER TABLE dbo.[Tax] ADD CONSTRAINT DF_Tax_CreatedDate DEFAULT GETDATE() FOR [CreatedDate];
  IF NOT EXISTS (SELECT 1 FROM sys.default_constraints WHERE name = N'DF_Tax_ModifiedDate')
    ALTER TABLE dbo.[Tax] ADD CONSTRAINT DF_Tax_ModifiedDate DEFAULT GETDATE() FOR [ModifiedDate];
  END
  INSERT INTO [SchemaMigration] ([MigrationName], [Batch]) VALUES (N'2018_03_04_041317_create_taxes_table', 8);
END
GO

-- MIGRATION: 2018_03_10_061915_create_customer_groups_table
IF NOT EXISTS (SELECT 1 FROM [SchemaMigration] WHERE [MigrationName] = N'2018_03_10_061915_create_customer_groups_table')
BEGIN
  IF OBJECT_ID(N'dbo.[CustomerGroup]', N'U') IS NULL
  BEGIN
  CREATE TABLE dbo.[CustomerGroup] (
    [Id] INT IDENTITY(1,1) NOT NULL,
    [Name] NVARCHAR(191) NOT NULL,
    [Percentage] NVARCHAR(191) NOT NULL,
    [IsActive] BIT NULL,
    [CreatedDate] DATETIME2 NULL,
    [ModifiedDate] DATETIME2 NULL
  );
  ALTER TABLE dbo.[CustomerGroup] ADD CONSTRAINT PK_CustomerGroup PRIMARY KEY ([Id]);
  IF NOT EXISTS (SELECT 1 FROM sys.default_constraints WHERE name = N'DF_CustomerGroup_CreatedDate')
    ALTER TABLE dbo.[CustomerGroup] ADD CONSTRAINT DF_CustomerGroup_CreatedDate DEFAULT GETDATE() FOR [CreatedDate];
  IF NOT EXISTS (SELECT 1 FROM sys.default_constraints WHERE name = N'DF_CustomerGroup_ModifiedDate')
    ALTER TABLE dbo.[CustomerGroup] ADD CONSTRAINT DF_CustomerGroup_ModifiedDate DEFAULT GETDATE() FOR [ModifiedDate];
  END
  INSERT INTO [SchemaMigration] ([MigrationName], [Batch]) VALUES (N'2018_03_10_061915_create_customer_groups_table', 9);
END
GO

-- MIGRATION: 2018_03_10_090534_create_customers_table
IF NOT EXISTS (SELECT 1 FROM [SchemaMigration] WHERE [MigrationName] = N'2018_03_10_090534_create_customers_table')
BEGIN
  IF OBJECT_ID(N'dbo.[Customer]', N'U') IS NULL
  BEGIN
  CREATE TABLE dbo.[Customer] (
    [Id] INT IDENTITY(1,1) NOT NULL,
    [CustomerGroupId] INT NOT NULL,
    [Name] NVARCHAR(191) NOT NULL,
    [CompanyName] NVARCHAR(191) NULL,
    [Email] NVARCHAR(191) NULL,
    [PhoneNumber] NVARCHAR(191) NOT NULL,
    [Address] NVARCHAR(191) NOT NULL,
    [City] NVARCHAR(191) NOT NULL,
    [State] NVARCHAR(191) NULL,
    [PostalCode] NVARCHAR(191) NULL,
    [Country] NVARCHAR(191) NULL,
    [IsActive] BIT NULL,
    [CreatedDate] DATETIME2 NULL,
    [ModifiedDate] DATETIME2 NULL
  );
  ALTER TABLE dbo.[Customer] ADD CONSTRAINT PK_Customer PRIMARY KEY ([Id]);
  IF NOT EXISTS (SELECT 1 FROM sys.default_constraints WHERE name = N'DF_Customer_CreatedDate')
    ALTER TABLE dbo.[Customer] ADD CONSTRAINT DF_Customer_CreatedDate DEFAULT GETDATE() FOR [CreatedDate];
  IF NOT EXISTS (SELECT 1 FROM sys.default_constraints WHERE name = N'DF_Customer_ModifiedDate')
    ALTER TABLE dbo.[Customer] ADD CONSTRAINT DF_Customer_ModifiedDate DEFAULT GETDATE() FOR [ModifiedDate];
  END
  INSERT INTO [SchemaMigration] ([MigrationName], [Batch]) VALUES (N'2018_03_10_090534_create_customers_table', 10);
END
GO

-- MIGRATION: 2018_03_11_095547_create_billers_table
IF NOT EXISTS (SELECT 1 FROM [SchemaMigration] WHERE [MigrationName] = N'2018_03_11_095547_create_billers_table')
BEGIN
  IF OBJECT_ID(N'dbo.[Biller]', N'U') IS NULL
  BEGIN
  CREATE TABLE dbo.[Biller] (
    [Id] INT IDENTITY(1,1) NOT NULL,
    [Name] NVARCHAR(191) NOT NULL,
    [Image] NVARCHAR(191) NULL,
    [CompanyName] NVARCHAR(191) NOT NULL,
    [VatNumber] NVARCHAR(191) NULL,
    [Email] NVARCHAR(191) NOT NULL,
    [PhoneNumber] NVARCHAR(191) NOT NULL,
    [Address] NVARCHAR(191) NOT NULL,
    [City] NVARCHAR(191) NOT NULL,
    [State] NVARCHAR(191) NULL,
    [PostalCode] NVARCHAR(191) NULL,
    [Country] NVARCHAR(191) NULL,
    [IsActive] BIT NULL,
    [CreatedDate] DATETIME2 NULL,
    [ModifiedDate] DATETIME2 NULL
  );
  ALTER TABLE dbo.[Biller] ADD CONSTRAINT PK_Biller PRIMARY KEY ([Id]);
  IF NOT EXISTS (SELECT 1 FROM sys.default_constraints WHERE name = N'DF_Biller_CreatedDate')
    ALTER TABLE dbo.[Biller] ADD CONSTRAINT DF_Biller_CreatedDate DEFAULT GETDATE() FOR [CreatedDate];
  IF NOT EXISTS (SELECT 1 FROM sys.default_constraints WHERE name = N'DF_Biller_ModifiedDate')
    ALTER TABLE dbo.[Biller] ADD CONSTRAINT DF_Biller_ModifiedDate DEFAULT GETDATE() FOR [ModifiedDate];
  END
  INSERT INTO [SchemaMigration] ([MigrationName], [Batch]) VALUES (N'2018_03_11_095547_create_billers_table', 11);
END
GO

-- MIGRATION: 2018_04_05_054401_create_products_table
IF NOT EXISTS (SELECT 1 FROM [SchemaMigration] WHERE [MigrationName] = N'2018_04_05_054401_create_products_table')
BEGIN
  IF OBJECT_ID(N'dbo.[Product]', N'U') IS NULL
  BEGIN
  CREATE TABLE dbo.[Product] (
    [Id] INT IDENTITY(1,1) NOT NULL,
    [Name] NVARCHAR(191) NOT NULL,
    [Code] NVARCHAR(191) NOT NULL,
    [Type] NVARCHAR(191) NOT NULL,
    [BarcodeSymbology] NVARCHAR(191) NOT NULL,
    [BrandId] INT NULL,
    [CategoryId] INT NOT NULL,
    [UnitId] INT NOT NULL,
    [PurchaseUnitId] INT NOT NULL,
    [SaleUnitId] INT NOT NULL,
    [Cost] NVARCHAR(191) NOT NULL,
    [Price] NVARCHAR(191) NOT NULL,
    [Qty] FLOAT NULL,
    [AlertQuantity] FLOAT NULL,
    [Promotion] INT NULL,
    [PromotionPrice] NVARCHAR(191) NULL,
    [StartingDate] DATE NULL,
    [LastDate] DATE NULL,
    [TaxId] INT NULL,
    [TaxMethod] INT NULL,
    [Image] NVARCHAR(MAX) NULL,
    [Featured] INT NULL,
    [ProductDetails] NVARCHAR(MAX) NULL,
    [IsActive] BIT NULL,
    [CreatedDate] DATETIME2 NULL,
    [ModifiedDate] DATETIME2 NULL
  );
  ALTER TABLE dbo.[Product] ADD CONSTRAINT PK_Product PRIMARY KEY ([Id]);
  IF NOT EXISTS (SELECT 1 FROM sys.default_constraints WHERE name = N'DF_Product_CreatedDate')
    ALTER TABLE dbo.[Product] ADD CONSTRAINT DF_Product_CreatedDate DEFAULT GETDATE() FOR [CreatedDate];
  IF NOT EXISTS (SELECT 1 FROM sys.default_constraints WHERE name = N'DF_Product_ModifiedDate')
    ALTER TABLE dbo.[Product] ADD CONSTRAINT DF_Product_ModifiedDate DEFAULT GETDATE() FOR [ModifiedDate];
  END
  INSERT INTO [SchemaMigration] ([MigrationName], [Batch]) VALUES (N'2018_04_05_054401_create_products_table', 12);
END
GO

-- MIGRATION: 2018_04_06_133606_create_purchases_table
IF NOT EXISTS (SELECT 1 FROM [SchemaMigration] WHERE [MigrationName] = N'2018_04_06_133606_create_purchases_table')
BEGIN
  IF OBJECT_ID(N'dbo.[Purchase]', N'U') IS NULL
  BEGIN
  CREATE TABLE dbo.[Purchase] (
    [Id] INT IDENTITY(1,1) NOT NULL,
    [ReferenceNo] NVARCHAR(191) NOT NULL,
    [WarehouseId] INT NOT NULL,
    [SupplierId] INT NULL,
    [Item] INT NOT NULL,
    [TotalQty] INT NOT NULL,
    [TotalDiscount] FLOAT NOT NULL,
    [TotalTax] FLOAT NOT NULL,
    [TotalCost] FLOAT NOT NULL,
    [OrderTaxRate] FLOAT NULL,
    [OrderTax] FLOAT NULL,
    [OrderDiscount] FLOAT NULL,
    [ShippingCost] FLOAT NULL,
    [GrandTotal] FLOAT NOT NULL,
    [PaidAmount] FLOAT NOT NULL,
    [Status] INT NOT NULL,
    [PaymentStatus] INT NOT NULL,
    [Document] NVARCHAR(191) NULL,
    [Note] NVARCHAR(MAX) NULL,
    [CreatedDate] DATETIME2 NULL,
    [ModifiedDate] DATETIME2 NULL
  );
  ALTER TABLE dbo.[Purchase] ADD CONSTRAINT PK_Purchase PRIMARY KEY ([Id]);
  IF NOT EXISTS (SELECT 1 FROM sys.default_constraints WHERE name = N'DF_Purchase_CreatedDate')
    ALTER TABLE dbo.[Purchase] ADD CONSTRAINT DF_Purchase_CreatedDate DEFAULT GETDATE() FOR [CreatedDate];
  IF NOT EXISTS (SELECT 1 FROM sys.default_constraints WHERE name = N'DF_Purchase_ModifiedDate')
    ALTER TABLE dbo.[Purchase] ADD CONSTRAINT DF_Purchase_ModifiedDate DEFAULT GETDATE() FOR [ModifiedDate];
  END
  INSERT INTO [SchemaMigration] ([MigrationName], [Batch]) VALUES (N'2018_04_06_133606_create_purchases_table', 13);
END
GO

-- MIGRATION: 2018_04_06_154600_create_product_purchases_table
IF NOT EXISTS (SELECT 1 FROM [SchemaMigration] WHERE [MigrationName] = N'2018_04_06_154600_create_product_purchases_table')
BEGIN
  IF OBJECT_ID(N'dbo.[ProductPurchase]', N'U') IS NULL
  BEGIN
  CREATE TABLE dbo.[ProductPurchase] (
    [Id] INT IDENTITY(1,1) NOT NULL,
    [PurchaseId] INT NOT NULL,
    [ProductId] INT NOT NULL,
    [Qty] FLOAT NOT NULL,
    [Recieved] FLOAT NOT NULL,
    [PurchaseUnitId] INT NOT NULL,
    [NetUnitCost] FLOAT NOT NULL,
    [Discount] FLOAT NOT NULL,
    [TaxRate] FLOAT NOT NULL,
    [Tax] FLOAT NOT NULL,
    [Total] FLOAT NOT NULL,
    [CreatedDate] DATETIME2 NULL,
    [ModifiedDate] DATETIME2 NULL
  );
  ALTER TABLE dbo.[ProductPurchase] ADD CONSTRAINT PK_ProductPurchase PRIMARY KEY ([Id]);
  IF NOT EXISTS (SELECT 1 FROM sys.default_constraints WHERE name = N'DF_ProductPurchase_CreatedDate')
    ALTER TABLE dbo.[ProductPurchase] ADD CONSTRAINT DF_ProductPurchase_CreatedDate DEFAULT GETDATE() FOR [CreatedDate];
  IF NOT EXISTS (SELECT 1 FROM sys.default_constraints WHERE name = N'DF_ProductPurchase_ModifiedDate')
    ALTER TABLE dbo.[ProductPurchase] ADD CONSTRAINT DF_ProductPurchase_ModifiedDate DEFAULT GETDATE() FOR [ModifiedDate];
  END
  INSERT INTO [SchemaMigration] ([MigrationName], [Batch]) VALUES (N'2018_04_06_154600_create_product_purchases_table', 14);
END
GO

-- MIGRATION: 2018_04_06_154915_create_product_warhouse_table
IF NOT EXISTS (SELECT 1 FROM [SchemaMigration] WHERE [MigrationName] = N'2018_04_06_154915_create_product_warhouse_table')
BEGIN
  IF OBJECT_ID(N'dbo.[ProductWarehouse]', N'U') IS NULL
  BEGIN
  CREATE TABLE dbo.[ProductWarehouse] (
    [Id] INT IDENTITY(1,1) NOT NULL,
    [ProductId] NVARCHAR(191) NOT NULL,
    [WarehouseId] INT NOT NULL,
    [Qty] FLOAT NOT NULL,
    [CreatedDate] DATETIME2 NULL,
    [ModifiedDate] DATETIME2 NULL
  );
  ALTER TABLE dbo.[ProductWarehouse] ADD CONSTRAINT PK_ProductWarehouse PRIMARY KEY ([Id]);
  IF NOT EXISTS (SELECT 1 FROM sys.default_constraints WHERE name = N'DF_ProductWarehouse_CreatedDate')
    ALTER TABLE dbo.[ProductWarehouse] ADD CONSTRAINT DF_ProductWarehouse_CreatedDate DEFAULT GETDATE() FOR [CreatedDate];
  IF NOT EXISTS (SELECT 1 FROM sys.default_constraints WHERE name = N'DF_ProductWarehouse_ModifiedDate')
    ALTER TABLE dbo.[ProductWarehouse] ADD CONSTRAINT DF_ProductWarehouse_ModifiedDate DEFAULT GETDATE() FOR [ModifiedDate];
  END
  INSERT INTO [SchemaMigration] ([MigrationName], [Batch]) VALUES (N'2018_04_06_154915_create_product_warhouse_table', 15);
END
GO

-- MIGRATION: 2018_04_10_085927_create_sales_table
IF NOT EXISTS (SELECT 1 FROM [SchemaMigration] WHERE [MigrationName] = N'2018_04_10_085927_create_sales_table')
BEGIN
  IF OBJECT_ID(N'dbo.[Sale]', N'U') IS NULL
  BEGIN
  CREATE TABLE dbo.[Sale] (
    [Id] INT IDENTITY(1,1) NOT NULL,
    [ReferenceNo] NVARCHAR(191) NOT NULL,
    [CustomerId] INT NOT NULL,
    [WarehouseId] INT NOT NULL,
    [BillerId] INT NOT NULL,
    [Item] INT NOT NULL,
    [TotalQty] FLOAT NOT NULL,
    [TotalDiscount] FLOAT NOT NULL,
    [TotalTax] FLOAT NOT NULL,
    [TotalPrice] FLOAT NOT NULL,
    [GrandTotal] FLOAT NOT NULL,
    [OrderTaxRate] FLOAT NULL,
    [OrderTax] FLOAT NULL,
    [OrderDiscount] FLOAT NULL,
    [ShippingCost] FLOAT NULL,
    [SaleStatus] INT NOT NULL,
    [PaymentStatus] INT NOT NULL,
    [Document] NVARCHAR(191) NULL,
    [PaidAmount] FLOAT NULL,
    [SaleNote] NVARCHAR(MAX) NULL,
    [StaffNote] NVARCHAR(MAX) NULL,
    [CreatedDate] DATETIME2 NULL,
    [ModifiedDate] DATETIME2 NULL
  );
  ALTER TABLE dbo.[Sale] ADD CONSTRAINT PK_Sale PRIMARY KEY ([Id]);
  IF NOT EXISTS (SELECT 1 FROM sys.default_constraints WHERE name = N'DF_Sale_CreatedDate')
    ALTER TABLE dbo.[Sale] ADD CONSTRAINT DF_Sale_CreatedDate DEFAULT GETDATE() FOR [CreatedDate];
  IF NOT EXISTS (SELECT 1 FROM sys.default_constraints WHERE name = N'DF_Sale_ModifiedDate')
    ALTER TABLE dbo.[Sale] ADD CONSTRAINT DF_Sale_ModifiedDate DEFAULT GETDATE() FOR [ModifiedDate];
  END
  INSERT INTO [SchemaMigration] ([MigrationName], [Batch]) VALUES (N'2018_04_10_085927_create_sales_table', 16);
END
GO

-- MIGRATION: 2018_04_10_090133_create_product_sales_table
IF NOT EXISTS (SELECT 1 FROM [SchemaMigration] WHERE [MigrationName] = N'2018_04_10_090133_create_product_sales_table')
BEGIN
  IF OBJECT_ID(N'dbo.[ProductSale]', N'U') IS NULL
  BEGIN
  CREATE TABLE dbo.[ProductSale] (
    [Id] INT IDENTITY(1,1) NOT NULL,
    [SaleId] INT NOT NULL,
    [ProductId] INT NOT NULL,
    [Qty] FLOAT NOT NULL,
    [SaleUnitId] INT NOT NULL,
    [NetUnitPrice] FLOAT NOT NULL,
    [Discount] FLOAT NOT NULL,
    [TaxRate] FLOAT NOT NULL,
    [Tax] FLOAT NOT NULL,
    [Total] FLOAT NOT NULL,
    [CreatedDate] DATETIME2 NULL,
    [ModifiedDate] DATETIME2 NULL
  );
  ALTER TABLE dbo.[ProductSale] ADD CONSTRAINT PK_ProductSale PRIMARY KEY ([Id]);
  IF NOT EXISTS (SELECT 1 FROM sys.default_constraints WHERE name = N'DF_ProductSale_CreatedDate')
    ALTER TABLE dbo.[ProductSale] ADD CONSTRAINT DF_ProductSale_CreatedDate DEFAULT GETDATE() FOR [CreatedDate];
  IF NOT EXISTS (SELECT 1 FROM sys.default_constraints WHERE name = N'DF_ProductSale_ModifiedDate')
    ALTER TABLE dbo.[ProductSale] ADD CONSTRAINT DF_ProductSale_ModifiedDate DEFAULT GETDATE() FOR [ModifiedDate];
  END
  INSERT INTO [SchemaMigration] ([MigrationName], [Batch]) VALUES (N'2018_04_10_090133_create_product_sales_table', 17);
END
GO

-- MIGRATION: 2018_04_10_090254_create_payments_table
IF NOT EXISTS (SELECT 1 FROM [SchemaMigration] WHERE [MigrationName] = N'2018_04_10_090254_create_payments_table')
BEGIN
  IF OBJECT_ID(N'dbo.[Payment]', N'U') IS NULL
  BEGIN
  CREATE TABLE dbo.[Payment] (
    [Id] INT IDENTITY(1,1) NOT NULL,
    [SaleId] INT NOT NULL,
    [PaymentReference] NVARCHAR(191) NOT NULL,
    [Amount] FLOAT NOT NULL,
    [PayingMethod] NVARCHAR(191) NOT NULL,
    [PaymentNote] NVARCHAR(MAX) NULL,
    [CreatedDate] DATETIME2 NULL,
    [ModifiedDate] DATETIME2 NULL
  );
  ALTER TABLE dbo.[Payment] ADD CONSTRAINT PK_Payment PRIMARY KEY ([Id]);
  IF NOT EXISTS (SELECT 1 FROM sys.default_constraints WHERE name = N'DF_Payment_CreatedDate')
    ALTER TABLE dbo.[Payment] ADD CONSTRAINT DF_Payment_CreatedDate DEFAULT GETDATE() FOR [CreatedDate];
  IF NOT EXISTS (SELECT 1 FROM sys.default_constraints WHERE name = N'DF_Payment_ModifiedDate')
    ALTER TABLE dbo.[Payment] ADD CONSTRAINT DF_Payment_ModifiedDate DEFAULT GETDATE() FOR [ModifiedDate];
  END
  INSERT INTO [SchemaMigration] ([MigrationName], [Batch]) VALUES (N'2018_04_10_090254_create_payments_table', 18);
END
GO

-- MIGRATION: 2018_04_10_090341_create_payment_with_cheque_table
IF NOT EXISTS (SELECT 1 FROM [SchemaMigration] WHERE [MigrationName] = N'2018_04_10_090341_create_payment_with_cheque_table')
BEGIN
  IF OBJECT_ID(N'dbo.[PaymentWithCheque]', N'U') IS NULL
  BEGIN
  CREATE TABLE dbo.[PaymentWithCheque] (
    [Id] INT IDENTITY(1,1) NOT NULL,
    [PaymentId] INT NOT NULL,
    [ChequeNo] NVARCHAR(191) NOT NULL,
    [CreatedDate] DATETIME2 NULL,
    [ModifiedDate] DATETIME2 NULL
  );
  ALTER TABLE dbo.[PaymentWithCheque] ADD CONSTRAINT PK_PaymentWithCheque PRIMARY KEY ([Id]);
  IF NOT EXISTS (SELECT 1 FROM sys.default_constraints WHERE name = N'DF_PaymentWithCheque_CreatedDate')
    ALTER TABLE dbo.[PaymentWithCheque] ADD CONSTRAINT DF_PaymentWithCheque_CreatedDate DEFAULT GETDATE() FOR [CreatedDate];
  IF NOT EXISTS (SELECT 1 FROM sys.default_constraints WHERE name = N'DF_PaymentWithCheque_ModifiedDate')
    ALTER TABLE dbo.[PaymentWithCheque] ADD CONSTRAINT DF_PaymentWithCheque_ModifiedDate DEFAULT GETDATE() FOR [ModifiedDate];
  END
  INSERT INTO [SchemaMigration] ([MigrationName], [Batch]) VALUES (N'2018_04_10_090341_create_payment_with_cheque_table', 19);
END
GO

-- MIGRATION: 2018_04_10_090509_create_payment_with_credit_card_table
IF NOT EXISTS (SELECT 1 FROM [SchemaMigration] WHERE [MigrationName] = N'2018_04_10_090509_create_payment_with_credit_card_table')
BEGIN
  IF OBJECT_ID(N'dbo.[PaymentWithCreditCard]', N'U') IS NULL
  BEGIN
  CREATE TABLE dbo.[PaymentWithCreditCard] (
    [Id] INT IDENTITY(1,1) NOT NULL,
    [PaymentId] INT NOT NULL,
    [CustomerId] INT NOT NULL,
    [CustomerStripeId] NVARCHAR(191) NOT NULL,
    [ChargeId] NVARCHAR(191) NOT NULL,
    [CreatedDate] DATETIME2 NULL,
    [ModifiedDate] DATETIME2 NULL
  );
  ALTER TABLE dbo.[PaymentWithCreditCard] ADD CONSTRAINT PK_PaymentWithCreditCard PRIMARY KEY ([Id]);
  IF NOT EXISTS (SELECT 1 FROM sys.default_constraints WHERE name = N'DF_PaymentWithCreditCard_CreatedDate')
    ALTER TABLE dbo.[PaymentWithCreditCard] ADD CONSTRAINT DF_PaymentWithCreditCard_CreatedDate DEFAULT GETDATE() FOR [CreatedDate];
  IF NOT EXISTS (SELECT 1 FROM sys.default_constraints WHERE name = N'DF_PaymentWithCreditCard_ModifiedDate')
    ALTER TABLE dbo.[PaymentWithCreditCard] ADD CONSTRAINT DF_PaymentWithCreditCard_ModifiedDate DEFAULT GETDATE() FOR [ModifiedDate];
  END
  INSERT INTO [SchemaMigration] ([MigrationName], [Batch]) VALUES (N'2018_04_10_090509_create_payment_with_credit_card_table', 20);
END
GO

-- MIGRATION: 2018_04_13_121436_create_quotation_table
IF NOT EXISTS (SELECT 1 FROM [SchemaMigration] WHERE [MigrationName] = N'2018_04_13_121436_create_quotation_table')
BEGIN
  IF OBJECT_ID(N'dbo.[Quotation]', N'U') IS NULL
  BEGIN
  CREATE TABLE dbo.[Quotation] (
    [Id] INT IDENTITY(1,1) NOT NULL,
    [ReferenceNo] NVARCHAR(191) NOT NULL,
    [BillerId] INT NOT NULL,
    [SupplierId] INT NULL,
    [CustomerId] INT NOT NULL,
    [WarehouseId] INT NOT NULL,
    [Item] INT NOT NULL,
    [TotalQty] FLOAT NOT NULL,
    [TotalDiscount] FLOAT NOT NULL,
    [TotalTax] FLOAT NOT NULL,
    [TotalPrice] FLOAT NOT NULL,
    [OrderTaxRate] FLOAT NULL,
    [OrderTax] FLOAT NULL,
    [OrderDiscount] FLOAT NULL,
    [ShippingCost] FLOAT NULL,
    [GrandTotal] FLOAT NOT NULL,
    [QuotationStatus] INT NOT NULL,
    [Document] NVARCHAR(191) NULL,
    [Note] NVARCHAR(MAX) NULL,
    [CreatedDate] DATETIME2 NULL,
    [ModifiedDate] DATETIME2 NULL
  );
  ALTER TABLE dbo.[Quotation] ADD CONSTRAINT PK_Quotation PRIMARY KEY ([Id]);
  IF NOT EXISTS (SELECT 1 FROM sys.default_constraints WHERE name = N'DF_Quotation_CreatedDate')
    ALTER TABLE dbo.[Quotation] ADD CONSTRAINT DF_Quotation_CreatedDate DEFAULT GETDATE() FOR [CreatedDate];
  IF NOT EXISTS (SELECT 1 FROM sys.default_constraints WHERE name = N'DF_Quotation_ModifiedDate')
    ALTER TABLE dbo.[Quotation] ADD CONSTRAINT DF_Quotation_ModifiedDate DEFAULT GETDATE() FOR [ModifiedDate];
  END
  INSERT INTO [SchemaMigration] ([MigrationName], [Batch]) VALUES (N'2018_04_13_121436_create_quotation_table', 21);
END
GO

-- MIGRATION: 2018_04_13_122324_create_product_quotation_table
IF NOT EXISTS (SELECT 1 FROM [SchemaMigration] WHERE [MigrationName] = N'2018_04_13_122324_create_product_quotation_table')
BEGIN
  IF OBJECT_ID(N'dbo.[ProductQuotation]', N'U') IS NULL
  BEGIN
  CREATE TABLE dbo.[ProductQuotation] (
    [Id] INT IDENTITY(1,1) NOT NULL,
    [QuotationId] INT NOT NULL,
    [ProductId] INT NOT NULL,
    [Qty] FLOAT NOT NULL,
    [SaleUnitId] INT NOT NULL,
    [NetUnitPrice] FLOAT NOT NULL,
    [Discount] FLOAT NOT NULL,
    [TaxRate] FLOAT NOT NULL,
    [Tax] FLOAT NOT NULL,
    [Total] FLOAT NOT NULL,
    [CreatedDate] DATETIME2 NULL,
    [ModifiedDate] DATETIME2 NULL
  );
  ALTER TABLE dbo.[ProductQuotation] ADD CONSTRAINT PK_ProductQuotation PRIMARY KEY ([Id]);
  IF NOT EXISTS (SELECT 1 FROM sys.default_constraints WHERE name = N'DF_ProductQuotation_CreatedDate')
    ALTER TABLE dbo.[ProductQuotation] ADD CONSTRAINT DF_ProductQuotation_CreatedDate DEFAULT GETDATE() FOR [CreatedDate];
  IF NOT EXISTS (SELECT 1 FROM sys.default_constraints WHERE name = N'DF_ProductQuotation_ModifiedDate')
    ALTER TABLE dbo.[ProductQuotation] ADD CONSTRAINT DF_ProductQuotation_ModifiedDate DEFAULT GETDATE() FOR [ModifiedDate];
  END
  INSERT INTO [SchemaMigration] ([MigrationName], [Batch]) VALUES (N'2018_04_13_122324_create_product_quotation_table', 22);
END
GO

-- MIGRATION: 2018_04_14_121802_create_transfers_table
IF NOT EXISTS (SELECT 1 FROM [SchemaMigration] WHERE [MigrationName] = N'2018_04_14_121802_create_transfers_table')
BEGIN
  IF OBJECT_ID(N'dbo.[Transfer]', N'U') IS NULL
  BEGIN
  CREATE TABLE dbo.[Transfer] (
    [Id] INT IDENTITY(1,1) NOT NULL,
    [ReferenceNo] NVARCHAR(191) NOT NULL,
    [Status] INT NOT NULL,
    [FromWarehouseId] INT NOT NULL,
    [ToWarehouseId] INT NOT NULL,
    [Item] INT NOT NULL,
    [TotalQty] FLOAT NOT NULL,
    [TotalTax] FLOAT NOT NULL,
    [TotalCost] FLOAT NOT NULL,
    [ShippingCost] FLOAT NULL,
    [GrandTotal] FLOAT NOT NULL,
    [Document] NVARCHAR(191) NULL,
    [Note] NVARCHAR(MAX) NULL,
    [CreatedDate] DATETIME2 NULL,
    [ModifiedDate] DATETIME2 NULL
  );
  ALTER TABLE dbo.[Transfer] ADD CONSTRAINT PK_Transfer PRIMARY KEY ([Id]);
  IF NOT EXISTS (SELECT 1 FROM sys.default_constraints WHERE name = N'DF_Transfer_CreatedDate')
    ALTER TABLE dbo.[Transfer] ADD CONSTRAINT DF_Transfer_CreatedDate DEFAULT GETDATE() FOR [CreatedDate];
  IF NOT EXISTS (SELECT 1 FROM sys.default_constraints WHERE name = N'DF_Transfer_ModifiedDate')
    ALTER TABLE dbo.[Transfer] ADD CONSTRAINT DF_Transfer_ModifiedDate DEFAULT GETDATE() FOR [ModifiedDate];
  END
  INSERT INTO [SchemaMigration] ([MigrationName], [Batch]) VALUES (N'2018_04_14_121802_create_transfers_table', 23);
END
GO

-- MIGRATION: 2018_04_14_121913_create_product_transfer_table
IF NOT EXISTS (SELECT 1 FROM [SchemaMigration] WHERE [MigrationName] = N'2018_04_14_121913_create_product_transfer_table')
BEGIN
  IF OBJECT_ID(N'dbo.[ProductTransfer]', N'U') IS NULL
  BEGIN
  CREATE TABLE dbo.[ProductTransfer] (
    [Id] INT IDENTITY(1,1) NOT NULL,
    [TransferId] INT NOT NULL,
    [ProductId] INT NOT NULL,
    [Qty] FLOAT NOT NULL,
    [PurchaseUnitId] INT NOT NULL,
    [NetUnitCost] FLOAT NOT NULL,
    [TaxRate] FLOAT NOT NULL,
    [Tax] FLOAT NOT NULL,
    [Total] FLOAT NOT NULL,
    [CreatedDate] DATETIME2 NULL,
    [ModifiedDate] DATETIME2 NULL
  );
  ALTER TABLE dbo.[ProductTransfer] ADD CONSTRAINT PK_ProductTransfer PRIMARY KEY ([Id]);
  IF NOT EXISTS (SELECT 1 FROM sys.default_constraints WHERE name = N'DF_ProductTransfer_CreatedDate')
    ALTER TABLE dbo.[ProductTransfer] ADD CONSTRAINT DF_ProductTransfer_CreatedDate DEFAULT GETDATE() FOR [CreatedDate];
  IF NOT EXISTS (SELECT 1 FROM sys.default_constraints WHERE name = N'DF_ProductTransfer_ModifiedDate')
    ALTER TABLE dbo.[ProductTransfer] ADD CONSTRAINT DF_ProductTransfer_ModifiedDate DEFAULT GETDATE() FOR [ModifiedDate];
  END
  INSERT INTO [SchemaMigration] ([MigrationName], [Batch]) VALUES (N'2018_04_14_121913_create_product_transfer_table', 24);
END
GO

-- MIGRATION: 2018_05_13_082847_add_payment_id_and_change_sale_id_to_payments_table
IF NOT EXISTS (SELECT 1 FROM [SchemaMigration] WHERE [MigrationName] = N'2018_05_13_082847_add_payment_id_and_change_sale_id_to_payments_table')
BEGIN
  IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'dbo.[Payment]') AND name = N'PurchaseId')
  ALTER TABLE dbo.[Payment] ADD [PurchaseId] INT NULL;
  IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'dbo.[Payment]') AND name = N'SaleId')
  ALTER TABLE dbo.[Payment] ALTER COLUMN [SaleId] INT NULL;
  INSERT INTO [SchemaMigration] ([MigrationName], [Batch]) VALUES (N'2018_05_13_082847_add_payment_id_and_change_sale_id_to_payments_table', 25);
END
GO

-- MIGRATION: 2018_05_13_090906_change_customer_id_to_payment_with_credit_card_table
IF NOT EXISTS (SELECT 1 FROM [SchemaMigration] WHERE [MigrationName] = N'2018_05_13_090906_change_customer_id_to_payment_with_credit_card_table')
BEGIN
  IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'dbo.[PaymentWithCreditCard]') AND name = N'CustomerId')
  ALTER TABLE dbo.[PaymentWithCreditCard] ALTER COLUMN [CustomerId] INT NULL;
  IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'dbo.[PaymentWithCreditCard]') AND name = N'CustomerStripeId')
  ALTER TABLE dbo.[PaymentWithCreditCard] ALTER COLUMN [CustomerStripeId] NVARCHAR(191) NULL;
  INSERT INTO [SchemaMigration] ([MigrationName], [Batch]) VALUES (N'2018_05_13_090906_change_customer_id_to_payment_with_credit_card_table', 26);
END
GO

-- MIGRATION: 2018_05_20_054532_create_adjustments_table
IF NOT EXISTS (SELECT 1 FROM [SchemaMigration] WHERE [MigrationName] = N'2018_05_20_054532_create_adjustments_table')
BEGIN
  IF OBJECT_ID(N'dbo.[Adjustment]', N'U') IS NULL
  BEGIN
  CREATE TABLE dbo.[Adjustment] (
    [Id] INT IDENTITY(1,1) NOT NULL,
    [ReferenceNo] NVARCHAR(191) NOT NULL,
    [WarehouseId] INT NOT NULL,
    [Document] NVARCHAR(191) NULL,
    [TotalQty] FLOAT NOT NULL,
    [Item] INT NOT NULL,
    [Note] NVARCHAR(MAX) NULL,
    [CreatedDate] DATETIME2 NULL,
    [ModifiedDate] DATETIME2 NULL
  );
  ALTER TABLE dbo.[Adjustment] ADD CONSTRAINT PK_Adjustment PRIMARY KEY ([Id]);
  IF NOT EXISTS (SELECT 1 FROM sys.default_constraints WHERE name = N'DF_Adjustment_CreatedDate')
    ALTER TABLE dbo.[Adjustment] ADD CONSTRAINT DF_Adjustment_CreatedDate DEFAULT GETDATE() FOR [CreatedDate];
  IF NOT EXISTS (SELECT 1 FROM sys.default_constraints WHERE name = N'DF_Adjustment_ModifiedDate')
    ALTER TABLE dbo.[Adjustment] ADD CONSTRAINT DF_Adjustment_ModifiedDate DEFAULT GETDATE() FOR [ModifiedDate];
  END
  INSERT INTO [SchemaMigration] ([MigrationName], [Batch]) VALUES (N'2018_05_20_054532_create_adjustments_table', 27);
END
GO

-- MIGRATION: 2018_05_20_054859_create_product_adjustments_table
IF NOT EXISTS (SELECT 1 FROM [SchemaMigration] WHERE [MigrationName] = N'2018_05_20_054859_create_product_adjustments_table')
BEGIN
  IF OBJECT_ID(N'dbo.[ProductAdjustment]', N'U') IS NULL
  BEGIN
  CREATE TABLE dbo.[ProductAdjustment] (
    [Id] INT IDENTITY(1,1) NOT NULL,
    [AdjustmentId] INT NOT NULL,
    [ProductId] INT NOT NULL,
    [Qty] FLOAT NOT NULL,
    [Action] NVARCHAR(191) NOT NULL,
    [CreatedDate] DATETIME2 NULL,
    [ModifiedDate] DATETIME2 NULL
  );
  ALTER TABLE dbo.[ProductAdjustment] ADD CONSTRAINT PK_ProductAdjustment PRIMARY KEY ([Id]);
  IF NOT EXISTS (SELECT 1 FROM sys.default_constraints WHERE name = N'DF_ProductAdjustment_CreatedDate')
    ALTER TABLE dbo.[ProductAdjustment] ADD CONSTRAINT DF_ProductAdjustment_CreatedDate DEFAULT GETDATE() FOR [CreatedDate];
  IF NOT EXISTS (SELECT 1 FROM sys.default_constraints WHERE name = N'DF_ProductAdjustment_ModifiedDate')
    ALTER TABLE dbo.[ProductAdjustment] ADD CONSTRAINT DF_ProductAdjustment_ModifiedDate DEFAULT GETDATE() FOR [ModifiedDate];
  END
  INSERT INTO [SchemaMigration] ([MigrationName], [Batch]) VALUES (N'2018_05_20_054859_create_product_adjustments_table', 28);
END
GO

-- MIGRATION: 2018_05_21_163419_create_returns_table
IF NOT EXISTS (SELECT 1 FROM [SchemaMigration] WHERE [MigrationName] = N'2018_05_21_163419_create_returns_table')
BEGIN
  IF OBJECT_ID(N'dbo.[SaleReturn]', N'U') IS NULL
  BEGIN
  CREATE TABLE dbo.[SaleReturn] (
    [Id] INT IDENTITY(1,1) NOT NULL,
    [ReferenceNo] NVARCHAR(191) NOT NULL,
    [CustomerId] INT NOT NULL,
    [WarehouseId] INT NOT NULL,
    [BillerId] INT NOT NULL,
    [Item] INT NOT NULL,
    [TotalQty] FLOAT NOT NULL,
    [TotalDiscount] FLOAT NOT NULL,
    [TotalTax] FLOAT NOT NULL,
    [TotalPrice] FLOAT NOT NULL,
    [OrderTaxRate] FLOAT NULL,
    [OrderTax] FLOAT NULL,
    [GrandTotal] FLOAT NOT NULL,
    [Document] NVARCHAR(191) NULL,
    [ReturnNote] NVARCHAR(MAX) NULL,
    [StaffNote] NVARCHAR(MAX) NULL,
    [CreatedDate] DATETIME2 NULL,
    [ModifiedDate] DATETIME2 NULL
  );
  ALTER TABLE dbo.[SaleReturn] ADD CONSTRAINT PK_SaleReturn PRIMARY KEY ([Id]);
  IF NOT EXISTS (SELECT 1 FROM sys.default_constraints WHERE name = N'DF_SaleReturn_CreatedDate')
    ALTER TABLE dbo.[SaleReturn] ADD CONSTRAINT DF_SaleReturn_CreatedDate DEFAULT GETDATE() FOR [CreatedDate];
  IF NOT EXISTS (SELECT 1 FROM sys.default_constraints WHERE name = N'DF_SaleReturn_ModifiedDate')
    ALTER TABLE dbo.[SaleReturn] ADD CONSTRAINT DF_SaleReturn_ModifiedDate DEFAULT GETDATE() FOR [ModifiedDate];
  END
  INSERT INTO [SchemaMigration] ([MigrationName], [Batch]) VALUES (N'2018_05_21_163419_create_returns_table', 29);
END
GO

-- MIGRATION: 2018_05_21_163443_create_product_returns_table
IF NOT EXISTS (SELECT 1 FROM [SchemaMigration] WHERE [MigrationName] = N'2018_05_21_163443_create_product_returns_table')
BEGIN
  IF OBJECT_ID(N'dbo.[ProductReturn]', N'U') IS NULL
  BEGIN
  CREATE TABLE dbo.[ProductReturn] (
    [Id] INT IDENTITY(1,1) NOT NULL,
    [ReturnId] INT NOT NULL,
    [ProductId] INT NOT NULL,
    [Qty] FLOAT NOT NULL,
    [SaleUnitId] INT NOT NULL,
    [NetUnitPrice] FLOAT NOT NULL,
    [Discount] FLOAT NOT NULL,
    [TaxRate] FLOAT NOT NULL,
    [Tax] FLOAT NOT NULL,
    [Total] FLOAT NOT NULL,
    [CreatedDate] DATETIME2 NULL,
    [ModifiedDate] DATETIME2 NULL
  );
  ALTER TABLE dbo.[ProductReturn] ADD CONSTRAINT PK_ProductReturn PRIMARY KEY ([Id]);
  IF NOT EXISTS (SELECT 1 FROM sys.default_constraints WHERE name = N'DF_ProductReturn_CreatedDate')
    ALTER TABLE dbo.[ProductReturn] ADD CONSTRAINT DF_ProductReturn_CreatedDate DEFAULT GETDATE() FOR [CreatedDate];
  IF NOT EXISTS (SELECT 1 FROM sys.default_constraints WHERE name = N'DF_ProductReturn_ModifiedDate')
    ALTER TABLE dbo.[ProductReturn] ADD CONSTRAINT DF_ProductReturn_ModifiedDate DEFAULT GETDATE() FOR [ModifiedDate];
  END
  INSERT INTO [SchemaMigration] ([MigrationName], [Batch]) VALUES (N'2018_05_21_163443_create_product_returns_table', 30);
END
GO

-- MIGRATION: 2018_06_02_050905_create_roles_table
IF NOT EXISTS (SELECT 1 FROM [SchemaMigration] WHERE [MigrationName] = N'2018_06_02_050905_create_roles_table')
BEGIN
  IF OBJECT_ID(N'dbo.[Role]', N'U') IS NULL
  BEGIN
  CREATE TABLE dbo.[Role] (
    [Id] INT IDENTITY(1,1) NOT NULL,
    [Name] NVARCHAR(191) NOT NULL,
    [Description] NVARCHAR(MAX) NULL,
    [IsActive] BIT NOT NULL,
    [CreatedDate] DATETIME2 NULL,
    [ModifiedDate] DATETIME2 NULL
  );
  ALTER TABLE dbo.[Role] ADD CONSTRAINT PK_Role PRIMARY KEY ([Id]);
  IF NOT EXISTS (SELECT 1 FROM sys.default_constraints WHERE name = N'DF_Role_CreatedDate')
    ALTER TABLE dbo.[Role] ADD CONSTRAINT DF_Role_CreatedDate DEFAULT GETDATE() FOR [CreatedDate];
  IF NOT EXISTS (SELECT 1 FROM sys.default_constraints WHERE name = N'DF_Role_ModifiedDate')
    ALTER TABLE dbo.[Role] ADD CONSTRAINT DF_Role_ModifiedDate DEFAULT GETDATE() FOR [ModifiedDate];
  END
  INSERT INTO [SchemaMigration] ([MigrationName], [Batch]) VALUES (N'2018_06_02_050905_create_roles_table', 31);
END
GO

-- MIGRATION: 2018_06_02_073430_add_columns_to_users_table
IF NOT EXISTS (SELECT 1 FROM [SchemaMigration] WHERE [MigrationName] = N'2018_06_02_073430_add_columns_to_users_table')
BEGIN
  IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'dbo.[User]') AND name = N'Phone')
  ALTER TABLE dbo.[User] ADD [Phone] NVARCHAR(191) NOT NULL;
  IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'dbo.[User]') AND name = N'CompanyName')
  ALTER TABLE dbo.[User] ADD [CompanyName] NVARCHAR(191) NULL;
  IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'dbo.[User]') AND name = N'RoleId')
  ALTER TABLE dbo.[User] ADD [RoleId] INT NOT NULL;
  IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'dbo.[User]') AND name = N'IsActive')
  ALTER TABLE dbo.[User] ADD [IsActive] BIT NOT NULL;
  INSERT INTO [SchemaMigration] ([MigrationName], [Batch]) VALUES (N'2018_06_02_073430_add_columns_to_users_table', 32);
END
GO

-- MIGRATION: 2018_06_03_053738_create_permission_tables
IF NOT EXISTS (SELECT 1 FROM [SchemaMigration] WHERE [MigrationName] = N'2018_06_03_053738_create_permission_tables')
BEGIN
  IF OBJECT_ID(N'dbo.[Permission]', N'U') IS NULL
  BEGIN
  CREATE TABLE dbo.[Permission] (
    [Id] INT IDENTITY(1,1) NOT NULL,
    [Name] NVARCHAR(191) NOT NULL,
    [GuardName] NVARCHAR(191) NOT NULL,
    [CreatedDate] DATETIME2 NULL,
    [ModifiedDate] DATETIME2 NULL
  );
  ALTER TABLE dbo.[Permission] ADD CONSTRAINT PK_Permission PRIMARY KEY ([Id]);
  IF NOT EXISTS (SELECT 1 FROM sys.default_constraints WHERE name = N'DF_Permission_CreatedDate')
    ALTER TABLE dbo.[Permission] ADD CONSTRAINT DF_Permission_CreatedDate DEFAULT GETDATE() FOR [CreatedDate];
  IF NOT EXISTS (SELECT 1 FROM sys.default_constraints WHERE name = N'DF_Permission_ModifiedDate')
    ALTER TABLE dbo.[Permission] ADD CONSTRAINT DF_Permission_ModifiedDate DEFAULT GETDATE() FOR [ModifiedDate];
  END
  IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'dbo.[Role]') AND name = N'GuardName')
  ALTER TABLE dbo.[Role] ADD [GuardName] NVARCHAR(191) NULL;
  INSERT INTO [SchemaMigration] ([MigrationName], [Batch]) VALUES (N'2018_06_03_053738_create_permission_tables', 33);
END
GO

-- MIGRATION: 2018_06_21_063736_create_pos_setting_table
IF NOT EXISTS (SELECT 1 FROM [SchemaMigration] WHERE [MigrationName] = N'2018_06_21_063736_create_pos_setting_table')
BEGIN
  IF OBJECT_ID(N'dbo.[PosSetting]', N'U') IS NULL
  BEGIN
  CREATE TABLE dbo.[PosSetting] (
    [Id] INT NOT NULL,
    [CustomerId] INT NOT NULL,
    [WarehouseId] INT NOT NULL,
    [BillerId] INT NOT NULL,
    [ProductNumber] INT NOT NULL,
    [StripePublicKey] NVARCHAR(191) NULL,
    [StripeSecretKey] NVARCHAR(191) NOT NULL,
    [CreatedDate] DATETIME2 NULL,
    [ModifiedDate] DATETIME2 NULL
  );
  IF NOT EXISTS (SELECT 1 FROM sys.default_constraints WHERE name = N'DF_PosSetting_CreatedDate')
    ALTER TABLE dbo.[PosSetting] ADD CONSTRAINT DF_PosSetting_CreatedDate DEFAULT GETDATE() FOR [CreatedDate];
  IF NOT EXISTS (SELECT 1 FROM sys.default_constraints WHERE name = N'DF_PosSetting_ModifiedDate')
    ALTER TABLE dbo.[PosSetting] ADD CONSTRAINT DF_PosSetting_ModifiedDate DEFAULT GETDATE() FOR [ModifiedDate];
  END
  INSERT INTO [SchemaMigration] ([MigrationName], [Batch]) VALUES (N'2018_06_21_063736_create_pos_setting_table', 34);
END
GO

-- MIGRATION: 2018_06_21_094155_add_user_id_to_sales_table
IF NOT EXISTS (SELECT 1 FROM [SchemaMigration] WHERE [MigrationName] = N'2018_06_21_094155_add_user_id_to_sales_table')
BEGIN
  IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'dbo.[Sale]') AND name = N'UserId')
  ALTER TABLE dbo.[Sale] ADD [UserId] INT NOT NULL;
  INSERT INTO [SchemaMigration] ([MigrationName], [Batch]) VALUES (N'2018_06_21_094155_add_user_id_to_sales_table', 35);
END
GO

-- MIGRATION: 2018_06_21_101529_add_user_id_to_purchases_table
IF NOT EXISTS (SELECT 1 FROM [SchemaMigration] WHERE [MigrationName] = N'2018_06_21_101529_add_user_id_to_purchases_table')
BEGIN
  IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'dbo.[Purchase]') AND name = N'UserId')
  ALTER TABLE dbo.[Purchase] ADD [UserId] INT NOT NULL;
  INSERT INTO [SchemaMigration] ([MigrationName], [Batch]) VALUES (N'2018_06_21_101529_add_user_id_to_purchases_table', 36);
END
GO

-- MIGRATION: 2018_06_21_103512_add_user_id_to_transfers_table
IF NOT EXISTS (SELECT 1 FROM [SchemaMigration] WHERE [MigrationName] = N'2018_06_21_103512_add_user_id_to_transfers_table')
BEGIN
  IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'dbo.[Transfer]') AND name = N'UserId')
  ALTER TABLE dbo.[Transfer] ADD [UserId] INT NOT NULL;
  INSERT INTO [SchemaMigration] ([MigrationName], [Batch]) VALUES (N'2018_06_21_103512_add_user_id_to_transfers_table', 37);
END
GO

-- MIGRATION: 2018_06_23_061058_add_user_id_to_quotations_table
IF NOT EXISTS (SELECT 1 FROM [SchemaMigration] WHERE [MigrationName] = N'2018_06_23_061058_add_user_id_to_quotations_table')
BEGIN
  IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'dbo.[Quotation]') AND name = N'UserId')
  ALTER TABLE dbo.[Quotation] ADD [UserId] INT NOT NULL;
  INSERT INTO [SchemaMigration] ([MigrationName], [Batch]) VALUES (N'2018_06_23_061058_add_user_id_to_quotations_table', 38);
END
GO

-- MIGRATION: 2018_06_23_082427_add_is_deleted_to_users_table
IF NOT EXISTS (SELECT 1 FROM [SchemaMigration] WHERE [MigrationName] = N'2018_06_23_082427_add_is_deleted_to_users_table')
BEGIN
  IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'dbo.[User]') AND name = N'IsDeleted')
  ALTER TABLE dbo.[User] ADD [IsDeleted] BIT NOT NULL;
  INSERT INTO [SchemaMigration] ([MigrationName], [Batch]) VALUES (N'2018_06_23_082427_add_is_deleted_to_users_table', 39);
END
GO

-- MIGRATION: 2018_06_25_043308_change_email_to_users_table
IF NOT EXISTS (SELECT 1 FROM [SchemaMigration] WHERE [MigrationName] = N'2018_06_25_043308_change_email_to_users_table')
BEGIN
  IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'users_email_unique' AND object_id = OBJECT_ID(N'dbo.[User]'))
  DROP INDEX [users_email_unique] ON dbo.[User];
  INSERT INTO [SchemaMigration] ([MigrationName], [Batch]) VALUES (N'2018_06_25_043308_change_email_to_users_table', 40);
END
GO

-- MIGRATION: 2018_07_06_115449_create_general_settings_table
IF NOT EXISTS (SELECT 1 FROM [SchemaMigration] WHERE [MigrationName] = N'2018_07_06_115449_create_general_settings_table')
BEGIN
  IF OBJECT_ID(N'dbo.[GeneralSetting]', N'U') IS NULL
  BEGIN
  CREATE TABLE dbo.[GeneralSetting] (
    [Id] INT IDENTITY(1,1) NOT NULL,
    [SiteTitle] NVARCHAR(191) NOT NULL,
    [SiteLogo] NVARCHAR(191) NULL,
    [CreatedDate] DATETIME2 NULL,
    [ModifiedDate] DATETIME2 NULL
  );
  ALTER TABLE dbo.[GeneralSetting] ADD CONSTRAINT PK_GeneralSetting PRIMARY KEY ([Id]);
  IF NOT EXISTS (SELECT 1 FROM sys.default_constraints WHERE name = N'DF_GeneralSetting_CreatedDate')
    ALTER TABLE dbo.[GeneralSetting] ADD CONSTRAINT DF_GeneralSetting_CreatedDate DEFAULT GETDATE() FOR [CreatedDate];
  IF NOT EXISTS (SELECT 1 FROM sys.default_constraints WHERE name = N'DF_GeneralSetting_ModifiedDate')
    ALTER TABLE dbo.[GeneralSetting] ADD CONSTRAINT DF_GeneralSetting_ModifiedDate DEFAULT GETDATE() FOR [ModifiedDate];
  END
  INSERT INTO [SchemaMigration] ([MigrationName], [Batch]) VALUES (N'2018_07_06_115449_create_general_settings_table', 41);
END
GO

-- MIGRATION: 2018_07_08_043944_create_languages_table
IF NOT EXISTS (SELECT 1 FROM [SchemaMigration] WHERE [MigrationName] = N'2018_07_08_043944_create_languages_table')
BEGIN
  IF OBJECT_ID(N'dbo.[Language]', N'U') IS NULL
  BEGIN
  CREATE TABLE dbo.[Language] (
    [Id] INT IDENTITY(1,1) NOT NULL,
    [Code] NVARCHAR(191) NOT NULL,
    [CreatedDate] DATETIME2 NULL,
    [ModifiedDate] DATETIME2 NULL
  );
  ALTER TABLE dbo.[Language] ADD CONSTRAINT PK_Language PRIMARY KEY ([Id]);
  IF NOT EXISTS (SELECT 1 FROM sys.default_constraints WHERE name = N'DF_Language_CreatedDate')
    ALTER TABLE dbo.[Language] ADD CONSTRAINT DF_Language_CreatedDate DEFAULT GETDATE() FOR [CreatedDate];
  IF NOT EXISTS (SELECT 1 FROM sys.default_constraints WHERE name = N'DF_Language_ModifiedDate')
    ALTER TABLE dbo.[Language] ADD CONSTRAINT DF_Language_ModifiedDate DEFAULT GETDATE() FOR [ModifiedDate];
  END
  INSERT INTO [SchemaMigration] ([MigrationName], [Batch]) VALUES (N'2018_07_08_043944_create_languages_table', 42);
END
GO

-- MIGRATION: 2018_07_11_102144_add_user_id_to_returns_table
IF NOT EXISTS (SELECT 1 FROM [SchemaMigration] WHERE [MigrationName] = N'2018_07_11_102144_add_user_id_to_returns_table')
BEGIN
  IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'dbo.[SaleReturn]') AND name = N'UserId')
  ALTER TABLE dbo.[SaleReturn] ADD [UserId] INT NOT NULL;
  INSERT INTO [SchemaMigration] ([MigrationName], [Batch]) VALUES (N'2018_07_11_102144_add_user_id_to_returns_table', 43);
END
GO

-- MIGRATION: 2018_07_11_102334_add_user_id_to_payments_table
IF NOT EXISTS (SELECT 1 FROM [SchemaMigration] WHERE [MigrationName] = N'2018_07_11_102334_add_user_id_to_payments_table')
BEGIN
  IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'dbo.[Payment]') AND name = N'UserId')
  ALTER TABLE dbo.[Payment] ADD [UserId] INT NOT NULL;
  INSERT INTO [SchemaMigration] ([MigrationName], [Batch]) VALUES (N'2018_07_11_102334_add_user_id_to_payments_table', 44);
END
GO

-- MIGRATION: 2018_07_22_130541_add_digital_to_products_table
IF NOT EXISTS (SELECT 1 FROM [SchemaMigration] WHERE [MigrationName] = N'2018_07_22_130541_add_digital_to_products_table')
BEGIN
  IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'dbo.[Product]') AND name = N'File')
  ALTER TABLE dbo.[Product] ADD [File] NVARCHAR(191) NULL;
  INSERT INTO [SchemaMigration] ([MigrationName], [Batch]) VALUES (N'2018_07_22_130541_add_digital_to_products_table', 45);
END
GO

-- MIGRATION: 2018_07_24_154250_create_deliveries_table
IF NOT EXISTS (SELECT 1 FROM [SchemaMigration] WHERE [MigrationName] = N'2018_07_24_154250_create_deliveries_table')
BEGIN
  IF OBJECT_ID(N'dbo.[Delivery]', N'U') IS NULL
  BEGIN
  CREATE TABLE dbo.[Delivery] (
    [Id] INT IDENTITY(1,1) NOT NULL,
    [ReferenceNo] NVARCHAR(191) NOT NULL,
    [SaleId] INT NOT NULL,
    [Address] NVARCHAR(MAX) NOT NULL,
    [DeliveredBy] NVARCHAR(191) NULL,
    [RecievedBy] NVARCHAR(191) NULL,
    [File] NVARCHAR(191) NULL,
    [Note] NVARCHAR(191) NULL,
    [Status] NVARCHAR(191) NOT NULL,
    [CreatedDate] DATETIME2 NULL,
    [ModifiedDate] DATETIME2 NULL
  );
  ALTER TABLE dbo.[Delivery] ADD CONSTRAINT PK_Delivery PRIMARY KEY ([Id]);
  IF NOT EXISTS (SELECT 1 FROM sys.default_constraints WHERE name = N'DF_Delivery_CreatedDate')
    ALTER TABLE dbo.[Delivery] ADD CONSTRAINT DF_Delivery_CreatedDate DEFAULT GETDATE() FOR [CreatedDate];
  IF NOT EXISTS (SELECT 1 FROM sys.default_constraints WHERE name = N'DF_Delivery_ModifiedDate')
    ALTER TABLE dbo.[Delivery] ADD CONSTRAINT DF_Delivery_ModifiedDate DEFAULT GETDATE() FOR [ModifiedDate];
  END
  INSERT INTO [SchemaMigration] ([MigrationName], [Batch]) VALUES (N'2018_07_24_154250_create_deliveries_table', 46);
END
GO

-- MIGRATION: 2018_08_16_053336_create_expense_categories_table
IF NOT EXISTS (SELECT 1 FROM [SchemaMigration] WHERE [MigrationName] = N'2018_08_16_053336_create_expense_categories_table')
BEGIN
  IF OBJECT_ID(N'dbo.[ExpenseCategory]', N'U') IS NULL
  BEGIN
  CREATE TABLE dbo.[ExpenseCategory] (
    [Id] INT IDENTITY(1,1) NOT NULL,
    [Code] NVARCHAR(191) NOT NULL,
    [Name] NVARCHAR(191) NOT NULL,
    [IsActive] BIT NOT NULL,
    [CreatedDate] DATETIME2 NULL,
    [ModifiedDate] DATETIME2 NULL
  );
  ALTER TABLE dbo.[ExpenseCategory] ADD CONSTRAINT PK_ExpenseCategory PRIMARY KEY ([Id]);
  IF NOT EXISTS (SELECT 1 FROM sys.default_constraints WHERE name = N'DF_ExpenseCategory_CreatedDate')
    ALTER TABLE dbo.[ExpenseCategory] ADD CONSTRAINT DF_ExpenseCategory_CreatedDate DEFAULT GETDATE() FOR [CreatedDate];
  IF NOT EXISTS (SELECT 1 FROM sys.default_constraints WHERE name = N'DF_ExpenseCategory_ModifiedDate')
    ALTER TABLE dbo.[ExpenseCategory] ADD CONSTRAINT DF_ExpenseCategory_ModifiedDate DEFAULT GETDATE() FOR [ModifiedDate];
  END
  INSERT INTO [SchemaMigration] ([MigrationName], [Batch]) VALUES (N'2018_08_16_053336_create_expense_categories_table', 47);
END
GO

-- MIGRATION: 2018_08_17_115415_create_expenses_table
IF NOT EXISTS (SELECT 1 FROM [SchemaMigration] WHERE [MigrationName] = N'2018_08_17_115415_create_expenses_table')
BEGIN
  IF OBJECT_ID(N'dbo.[Expense]', N'U') IS NULL
  BEGIN
  CREATE TABLE dbo.[Expense] (
    [Id] INT IDENTITY(1,1) NOT NULL,
    [ReferenceNo] NVARCHAR(191) NOT NULL,
    [ExpenseCategoryId] INT NOT NULL,
    [WarehouseId] INT NOT NULL,
    [Amount] FLOAT NOT NULL,
    [Note] NVARCHAR(MAX) NULL,
    [CreatedDate] DATETIME2 NULL,
    [ModifiedDate] DATETIME2 NULL
  );
  ALTER TABLE dbo.[Expense] ADD CONSTRAINT PK_Expense PRIMARY KEY ([Id]);
  IF NOT EXISTS (SELECT 1 FROM sys.default_constraints WHERE name = N'DF_Expense_CreatedDate')
    ALTER TABLE dbo.[Expense] ADD CONSTRAINT DF_Expense_CreatedDate DEFAULT GETDATE() FOR [CreatedDate];
  IF NOT EXISTS (SELECT 1 FROM sys.default_constraints WHERE name = N'DF_Expense_ModifiedDate')
    ALTER TABLE dbo.[Expense] ADD CONSTRAINT DF_Expense_ModifiedDate DEFAULT GETDATE() FOR [ModifiedDate];
  END
  INSERT INTO [SchemaMigration] ([MigrationName], [Batch]) VALUES (N'2018_08_17_115415_create_expenses_table', 48);
END
GO

-- MIGRATION: 2018_08_18_050418_create_gift_cards_table
IF NOT EXISTS (SELECT 1 FROM [SchemaMigration] WHERE [MigrationName] = N'2018_08_18_050418_create_gift_cards_table')
BEGIN
  IF OBJECT_ID(N'dbo.[GiftCard]', N'U') IS NULL
  BEGIN
  CREATE TABLE dbo.[GiftCard] (
    [Id] INT IDENTITY(1,1) NOT NULL,
    [CardNo] NVARCHAR(191) NOT NULL,
    [Amount] FLOAT NOT NULL,
    [Expense] FLOAT NOT NULL,
    [CustomerId] INT NULL,
    [UserId] INT NULL,
    [ExpiredDate] DATE NULL,
    [CreatedBy] INT NOT NULL,
    [IsActive] BIT NOT NULL,
    [CreatedDate] DATETIME2 NULL,
    [ModifiedDate] DATETIME2 NULL
  );
  ALTER TABLE dbo.[GiftCard] ADD CONSTRAINT PK_GiftCard PRIMARY KEY ([Id]);
  IF NOT EXISTS (SELECT 1 FROM sys.default_constraints WHERE name = N'DF_GiftCard_CreatedDate')
    ALTER TABLE dbo.[GiftCard] ADD CONSTRAINT DF_GiftCard_CreatedDate DEFAULT GETDATE() FOR [CreatedDate];
  IF NOT EXISTS (SELECT 1 FROM sys.default_constraints WHERE name = N'DF_GiftCard_ModifiedDate')
    ALTER TABLE dbo.[GiftCard] ADD CONSTRAINT DF_GiftCard_ModifiedDate DEFAULT GETDATE() FOR [ModifiedDate];
  END
  INSERT INTO [SchemaMigration] ([MigrationName], [Batch]) VALUES (N'2018_08_18_050418_create_gift_cards_table', 49);
END
GO

-- MIGRATION: 2018_08_19_063119_create_payment_with_gift_card_table
IF NOT EXISTS (SELECT 1 FROM [SchemaMigration] WHERE [MigrationName] = N'2018_08_19_063119_create_payment_with_gift_card_table')
BEGIN
  IF OBJECT_ID(N'dbo.[PaymentWithGiftCard]', N'U') IS NULL
  BEGIN
  CREATE TABLE dbo.[PaymentWithGiftCard] (
    [Id] INT IDENTITY(1,1) NOT NULL,
    [PaymentId] INT NOT NULL,
    [GiftCardId] INT NOT NULL,
    [CreatedDate] DATETIME2 NULL,
    [ModifiedDate] DATETIME2 NULL
  );
  ALTER TABLE dbo.[PaymentWithGiftCard] ADD CONSTRAINT PK_PaymentWithGiftCard PRIMARY KEY ([Id]);
  IF NOT EXISTS (SELECT 1 FROM sys.default_constraints WHERE name = N'DF_PaymentWithGiftCard_CreatedDate')
    ALTER TABLE dbo.[PaymentWithGiftCard] ADD CONSTRAINT DF_PaymentWithGiftCard_CreatedDate DEFAULT GETDATE() FOR [CreatedDate];
  IF NOT EXISTS (SELECT 1 FROM sys.default_constraints WHERE name = N'DF_PaymentWithGiftCard_ModifiedDate')
    ALTER TABLE dbo.[PaymentWithGiftCard] ADD CONSTRAINT DF_PaymentWithGiftCard_ModifiedDate DEFAULT GETDATE() FOR [ModifiedDate];
  END
  INSERT INTO [SchemaMigration] ([MigrationName], [Batch]) VALUES (N'2018_08_19_063119_create_payment_with_gift_card_table', 50);
END
GO

-- MIGRATION: 2018_08_25_042333_create_gift_card_recharges_table
IF NOT EXISTS (SELECT 1 FROM [SchemaMigration] WHERE [MigrationName] = N'2018_08_25_042333_create_gift_card_recharges_table')
BEGIN
  IF OBJECT_ID(N'dbo.[GiftCardRecharge]', N'U') IS NULL
  BEGIN
  CREATE TABLE dbo.[GiftCardRecharge] (
    [Id] INT IDENTITY(1,1) NOT NULL,
    [GiftCardId] INT NOT NULL,
    [Amount] FLOAT NOT NULL,
    [UserId] INT NOT NULL,
    [CreatedDate] DATETIME2 NULL,
    [ModifiedDate] DATETIME2 NULL
  );
  ALTER TABLE dbo.[GiftCardRecharge] ADD CONSTRAINT PK_GiftCardRecharge PRIMARY KEY ([Id]);
  IF NOT EXISTS (SELECT 1 FROM sys.default_constraints WHERE name = N'DF_GiftCardRecharge_CreatedDate')
    ALTER TABLE dbo.[GiftCardRecharge] ADD CONSTRAINT DF_GiftCardRecharge_CreatedDate DEFAULT GETDATE() FOR [CreatedDate];
  IF NOT EXISTS (SELECT 1 FROM sys.default_constraints WHERE name = N'DF_GiftCardRecharge_ModifiedDate')
    ALTER TABLE dbo.[GiftCardRecharge] ADD CONSTRAINT DF_GiftCardRecharge_ModifiedDate DEFAULT GETDATE() FOR [ModifiedDate];
  END
  INSERT INTO [SchemaMigration] ([MigrationName], [Batch]) VALUES (N'2018_08_25_042333_create_gift_card_recharges_table', 51);
END
GO

-- MIGRATION: 2018_08_25_101354_add_deposit_expense_to_customers_table
IF NOT EXISTS (SELECT 1 FROM [SchemaMigration] WHERE [MigrationName] = N'2018_08_25_101354_add_deposit_expense_to_customers_table')
BEGIN
  IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'dbo.[Customer]') AND name = N'Deposit')
  ALTER TABLE dbo.[Customer] ADD [Deposit] FLOAT NULL;
  IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'dbo.[Customer]') AND name = N'Expense')
  ALTER TABLE dbo.[Customer] ADD [Expense] FLOAT NULL;
  INSERT INTO [SchemaMigration] ([MigrationName], [Batch]) VALUES (N'2018_08_25_101354_add_deposit_expense_to_customers_table', 52);
END
GO

-- MIGRATION: 2018_08_26_043801_create_deposits_table
IF NOT EXISTS (SELECT 1 FROM [SchemaMigration] WHERE [MigrationName] = N'2018_08_26_043801_create_deposits_table')
BEGIN
  IF OBJECT_ID(N'dbo.[Deposit]', N'U') IS NULL
  BEGIN
  CREATE TABLE dbo.[Deposit] (
    [Id] INT IDENTITY(1,1) NOT NULL,
    [Amount] FLOAT NOT NULL,
    [CustomerId] INT NOT NULL,
    [UserId] INT NOT NULL,
    [Note] NVARCHAR(MAX) NULL,
    [CreatedDate] DATETIME2 NULL,
    [ModifiedDate] DATETIME2 NULL
  );
  ALTER TABLE dbo.[Deposit] ADD CONSTRAINT PK_Deposit PRIMARY KEY ([Id]);
  IF NOT EXISTS (SELECT 1 FROM sys.default_constraints WHERE name = N'DF_Deposit_CreatedDate')
    ALTER TABLE dbo.[Deposit] ADD CONSTRAINT DF_Deposit_CreatedDate DEFAULT GETDATE() FOR [CreatedDate];
  IF NOT EXISTS (SELECT 1 FROM sys.default_constraints WHERE name = N'DF_Deposit_ModifiedDate')
    ALTER TABLE dbo.[Deposit] ADD CONSTRAINT DF_Deposit_ModifiedDate DEFAULT GETDATE() FOR [ModifiedDate];
  END
  INSERT INTO [SchemaMigration] ([MigrationName], [Batch]) VALUES (N'2018_08_26_043801_create_deposits_table', 53);
END
GO

-- MIGRATION: 2018_09_02_044042_add_keybord_active_to_pos_setting_table
IF NOT EXISTS (SELECT 1 FROM [SchemaMigration] WHERE [MigrationName] = N'2018_09_02_044042_add_keybord_active_to_pos_setting_table')
BEGIN
  IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'dbo.[PosSetting]') AND name = N'KeybordActive')
  ALTER TABLE dbo.[PosSetting] ADD [KeybordActive] BIT NOT NULL;
  INSERT INTO [SchemaMigration] ([MigrationName], [Batch]) VALUES (N'2018_09_02_044042_add_keybord_active_to_pos_setting_table', 54);
END
GO

-- MIGRATION: 2018_09_09_092713_create_payment_with_paypal_table
IF NOT EXISTS (SELECT 1 FROM [SchemaMigration] WHERE [MigrationName] = N'2018_09_09_092713_create_payment_with_paypal_table')
BEGIN
  IF OBJECT_ID(N'dbo.[PaymentWithPaypal]', N'U') IS NULL
  BEGIN
  CREATE TABLE dbo.[PaymentWithPaypal] (
    [Id] INT IDENTITY(1,1) NOT NULL,
    [PaymentId] INT NOT NULL,
    [TransactionId] NVARCHAR(191) NOT NULL,
    [CreatedDate] DATETIME2 NULL,
    [ModifiedDate] DATETIME2 NULL
  );
  ALTER TABLE dbo.[PaymentWithPaypal] ADD CONSTRAINT PK_PaymentWithPaypal PRIMARY KEY ([Id]);
  IF NOT EXISTS (SELECT 1 FROM sys.default_constraints WHERE name = N'DF_PaymentWithPaypal_CreatedDate')
    ALTER TABLE dbo.[PaymentWithPaypal] ADD CONSTRAINT DF_PaymentWithPaypal_CreatedDate DEFAULT GETDATE() FOR [CreatedDate];
  IF NOT EXISTS (SELECT 1 FROM sys.default_constraints WHERE name = N'DF_PaymentWithPaypal_ModifiedDate')
    ALTER TABLE dbo.[PaymentWithPaypal] ADD CONSTRAINT DF_PaymentWithPaypal_ModifiedDate DEFAULT GETDATE() FOR [ModifiedDate];
  END
  INSERT INTO [SchemaMigration] ([MigrationName], [Batch]) VALUES (N'2018_09_09_092713_create_payment_with_paypal_table', 55);
END
GO

-- MIGRATION: 2018_09_10_051254_add_currency_to_general_settings_table
IF NOT EXISTS (SELECT 1 FROM [SchemaMigration] WHERE [MigrationName] = N'2018_09_10_051254_add_currency_to_general_settings_table')
BEGIN
  IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'dbo.[GeneralSetting]') AND name = N'Currency')
  ALTER TABLE dbo.[GeneralSetting] ADD [Currency] NVARCHAR(191) NOT NULL;
  INSERT INTO [SchemaMigration] ([MigrationName], [Batch]) VALUES (N'2018_09_10_051254_add_currency_to_general_settings_table', 56);
END
GO

-- MIGRATION: 2018_10_22_084118_add_biller_and_store_id_to_users_table
IF NOT EXISTS (SELECT 1 FROM [SchemaMigration] WHERE [MigrationName] = N'2018_10_22_084118_add_biller_and_store_id_to_users_table')
BEGIN
  IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'dbo.[User]') AND name = N'BillerId')
  ALTER TABLE dbo.[User] ADD [BillerId] INT NULL;
  IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'dbo.[User]') AND name = N'WarehouseId')
  ALTER TABLE dbo.[User] ADD [WarehouseId] INT NULL;
  INSERT INTO [SchemaMigration] ([MigrationName], [Batch]) VALUES (N'2018_10_22_084118_add_biller_and_store_id_to_users_table', 57);
END
GO

-- MIGRATION: 2018_10_26_034927_create_coupons_table
IF NOT EXISTS (SELECT 1 FROM [SchemaMigration] WHERE [MigrationName] = N'2018_10_26_034927_create_coupons_table')
BEGIN
  IF OBJECT_ID(N'dbo.[Coupon]', N'U') IS NULL
  BEGIN
  CREATE TABLE dbo.[Coupon] (
    [Id] INT IDENTITY(1,1) NOT NULL,
    [Code] NVARCHAR(191) NOT NULL,
    [Type] NVARCHAR(191) NOT NULL,
    [Amount] FLOAT NOT NULL,
    [MinimumAmount] FLOAT NULL,
    [Quantity] INT NOT NULL,
    [Used] INT NOT NULL,
    [ExpiredDate] DATE NOT NULL,
    [UserId] INT NOT NULL,
    [IsActive] BIT NOT NULL,
    [CreatedDate] DATETIME2 NULL,
    [ModifiedDate] DATETIME2 NULL
  );
  ALTER TABLE dbo.[Coupon] ADD CONSTRAINT PK_Coupon PRIMARY KEY ([Id]);
  IF NOT EXISTS (SELECT 1 FROM sys.default_constraints WHERE name = N'DF_Coupon_CreatedDate')
    ALTER TABLE dbo.[Coupon] ADD CONSTRAINT DF_Coupon_CreatedDate DEFAULT GETDATE() FOR [CreatedDate];
  IF NOT EXISTS (SELECT 1 FROM sys.default_constraints WHERE name = N'DF_Coupon_ModifiedDate')
    ALTER TABLE dbo.[Coupon] ADD CONSTRAINT DF_Coupon_ModifiedDate DEFAULT GETDATE() FOR [ModifiedDate];
  END
  INSERT INTO [SchemaMigration] ([MigrationName], [Batch]) VALUES (N'2018_10_26_034927_create_coupons_table', 58);
END
GO

-- MIGRATION: 2018_10_27_090857_add_coupon_to_sales_table
IF NOT EXISTS (SELECT 1 FROM [SchemaMigration] WHERE [MigrationName] = N'2018_10_27_090857_add_coupon_to_sales_table')
BEGIN
  IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'dbo.[Sale]') AND name = N'CouponId')
  ALTER TABLE dbo.[Sale] ADD [CouponId] INT NULL;
  IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'dbo.[Sale]') AND name = N'CouponDiscount')
  ALTER TABLE dbo.[Sale] ADD [CouponDiscount] FLOAT NULL;
  INSERT INTO [SchemaMigration] ([MigrationName], [Batch]) VALUES (N'2018_10_27_090857_add_coupon_to_sales_table', 59);
END
GO

-- MIGRATION: 2018_11_07_070155_add_currency_position_to_general_settings_table
IF NOT EXISTS (SELECT 1 FROM [SchemaMigration] WHERE [MigrationName] = N'2018_11_07_070155_add_currency_position_to_general_settings_table')
BEGIN
  IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'dbo.[GeneralSetting]') AND name = N'CurrencyPosition')
  ALTER TABLE dbo.[GeneralSetting] ADD [CurrencyPosition] NVARCHAR(191) NOT NULL;
  INSERT INTO [SchemaMigration] ([MigrationName], [Batch]) VALUES (N'2018_11_07_070155_add_currency_position_to_general_settings_table', 60);
END
GO

-- MIGRATION: 2018_11_19_094650_add_combo_to_products_table
IF NOT EXISTS (SELECT 1 FROM [SchemaMigration] WHERE [MigrationName] = N'2018_11_19_094650_add_combo_to_products_table')
BEGIN
  IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'dbo.[Product]') AND name = N'ProductList')
  ALTER TABLE dbo.[Product] ADD [ProductList] NVARCHAR(191) NULL;
  IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'dbo.[Product]') AND name = N'QtyList')
  ALTER TABLE dbo.[Product] ADD [QtyList] NVARCHAR(191) NULL;
  IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'dbo.[Product]') AND name = N'PriceList')
  ALTER TABLE dbo.[Product] ADD [PriceList] NVARCHAR(191) NULL;
  INSERT INTO [SchemaMigration] ([MigrationName], [Batch]) VALUES (N'2018_11_19_094650_add_combo_to_products_table', 61);
END
GO

-- MIGRATION: 2018_12_09_043712_create_accounts_table
IF NOT EXISTS (SELECT 1 FROM [SchemaMigration] WHERE [MigrationName] = N'2018_12_09_043712_create_accounts_table')
BEGIN
  IF OBJECT_ID(N'dbo.[Account]', N'U') IS NULL
  BEGIN
  CREATE TABLE dbo.[Account] (
    [Id] INT IDENTITY(1,1) NOT NULL,
    [AccountNo] NVARCHAR(191) NOT NULL,
    [Name] NVARCHAR(191) NOT NULL,
    [InitialBalance] FLOAT NULL,
    [TotalBalance] FLOAT NOT NULL,
    [Note] NVARCHAR(MAX) NULL,
    [IsActive] BIT NOT NULL,
    [CreatedDate] DATETIME2 NULL,
    [ModifiedDate] DATETIME2 NULL
  );
  ALTER TABLE dbo.[Account] ADD CONSTRAINT PK_Account PRIMARY KEY ([Id]);
  IF NOT EXISTS (SELECT 1 FROM sys.default_constraints WHERE name = N'DF_Account_CreatedDate')
    ALTER TABLE dbo.[Account] ADD CONSTRAINT DF_Account_CreatedDate DEFAULT GETDATE() FOR [CreatedDate];
  IF NOT EXISTS (SELECT 1 FROM sys.default_constraints WHERE name = N'DF_Account_ModifiedDate')
    ALTER TABLE dbo.[Account] ADD CONSTRAINT DF_Account_ModifiedDate DEFAULT GETDATE() FOR [ModifiedDate];
  END
  INSERT INTO [SchemaMigration] ([MigrationName], [Batch]) VALUES (N'2018_12_09_043712_create_accounts_table', 62);
END
GO

-- MIGRATION: 2018_12_17_112253_add_is_default_to_accounts_table
IF NOT EXISTS (SELECT 1 FROM [SchemaMigration] WHERE [MigrationName] = N'2018_12_17_112253_add_is_default_to_accounts_table')
BEGIN
  IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'dbo.[Account]') AND name = N'IsDefault')
  ALTER TABLE dbo.[Account] ADD [IsDefault] BIT NULL;
  INSERT INTO [SchemaMigration] ([MigrationName], [Batch]) VALUES (N'2018_12_17_112253_add_is_default_to_accounts_table', 63);
END
GO

-- MIGRATION: 2018_12_19_103941_add_account_id_to_payments_table
IF NOT EXISTS (SELECT 1 FROM [SchemaMigration] WHERE [MigrationName] = N'2018_12_19_103941_add_account_id_to_payments_table')
BEGIN
  IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'dbo.[Payment]') AND name = N'AccountId')
  ALTER TABLE dbo.[Payment] ADD [AccountId] INT NOT NULL;
  INSERT INTO [SchemaMigration] ([MigrationName], [Batch]) VALUES (N'2018_12_19_103941_add_account_id_to_payments_table', 64);
END
GO

-- MIGRATION: 2018_12_20_065900_add_account_id_to_expenses_table
IF NOT EXISTS (SELECT 1 FROM [SchemaMigration] WHERE [MigrationName] = N'2018_12_20_065900_add_account_id_to_expenses_table')
BEGIN
  IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'dbo.[Expense]') AND name = N'AccountId')
  ALTER TABLE dbo.[Expense] ADD [AccountId] INT NOT NULL;
  INSERT INTO [SchemaMigration] ([MigrationName], [Batch]) VALUES (N'2018_12_20_065900_add_account_id_to_expenses_table', 65);
END
GO

-- MIGRATION: 2018_12_20_082753_add_account_id_to_returns_table
IF NOT EXISTS (SELECT 1 FROM [SchemaMigration] WHERE [MigrationName] = N'2018_12_20_082753_add_account_id_to_returns_table')
BEGIN
  IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'dbo.[SaleReturn]') AND name = N'AccountId')
  ALTER TABLE dbo.[SaleReturn] ADD [AccountId] INT NOT NULL;
  INSERT INTO [SchemaMigration] ([MigrationName], [Batch]) VALUES (N'2018_12_20_082753_add_account_id_to_returns_table', 66);
END
GO

-- MIGRATION: 2018_12_26_064330_create_return_purchases_table
IF NOT EXISTS (SELECT 1 FROM [SchemaMigration] WHERE [MigrationName] = N'2018_12_26_064330_create_return_purchases_table')
BEGIN
  IF OBJECT_ID(N'dbo.[ReturnPurchase]', N'U') IS NULL
  BEGIN
  CREATE TABLE dbo.[ReturnPurchase] (
    [Id] INT IDENTITY(1,1) NOT NULL,
    [ReferenceNo] NVARCHAR(191) NOT NULL,
    [SupplierId] INT NULL,
    [WarehouseId] INT NOT NULL,
    [UserId] INT NOT NULL,
    [AccountId] INT NOT NULL,
    [Item] INT NOT NULL,
    [TotalQty] FLOAT NOT NULL,
    [TotalDiscount] FLOAT NOT NULL,
    [TotalTax] FLOAT NOT NULL,
    [TotalCost] FLOAT NOT NULL,
    [OrderTaxRate] FLOAT NULL,
    [OrderTax] FLOAT NULL,
    [GrandTotal] FLOAT NOT NULL,
    [Document] NVARCHAR(191) NULL,
    [ReturnNote] NVARCHAR(MAX) NULL,
    [StaffNote] NVARCHAR(MAX) NULL,
    [CreatedDate] DATETIME2 NULL,
    [ModifiedDate] DATETIME2 NULL
  );
  ALTER TABLE dbo.[ReturnPurchase] ADD CONSTRAINT PK_ReturnPurchase PRIMARY KEY ([Id]);
  IF NOT EXISTS (SELECT 1 FROM sys.default_constraints WHERE name = N'DF_ReturnPurchase_CreatedDate')
    ALTER TABLE dbo.[ReturnPurchase] ADD CONSTRAINT DF_ReturnPurchase_CreatedDate DEFAULT GETDATE() FOR [CreatedDate];
  IF NOT EXISTS (SELECT 1 FROM sys.default_constraints WHERE name = N'DF_ReturnPurchase_ModifiedDate')
    ALTER TABLE dbo.[ReturnPurchase] ADD CONSTRAINT DF_ReturnPurchase_ModifiedDate DEFAULT GETDATE() FOR [ModifiedDate];
  END
  INSERT INTO [SchemaMigration] ([MigrationName], [Batch]) VALUES (N'2018_12_26_064330_create_return_purchases_table', 67);
END
GO

-- MIGRATION: 2018_12_26_144708_create_purchase_product_return_table
IF NOT EXISTS (SELECT 1 FROM [SchemaMigration] WHERE [MigrationName] = N'2018_12_26_144708_create_purchase_product_return_table')
BEGIN
  IF OBJECT_ID(N'dbo.[PurchaseProductReturn]', N'U') IS NULL
  BEGIN
  CREATE TABLE dbo.[PurchaseProductReturn] (
    [Id] INT IDENTITY(1,1) NOT NULL,
    [ReturnId] INT NOT NULL,
    [ProductId] INT NOT NULL,
    [Qty] FLOAT NOT NULL,
    [PurchaseUnitId] INT NOT NULL,
    [NetUnitCost] FLOAT NOT NULL,
    [Discount] FLOAT NOT NULL,
    [TaxRate] FLOAT NOT NULL,
    [Tax] FLOAT NOT NULL,
    [Total] FLOAT NOT NULL,
    [CreatedDate] DATETIME2 NULL,
    [ModifiedDate] DATETIME2 NULL
  );
  ALTER TABLE dbo.[PurchaseProductReturn] ADD CONSTRAINT PK_PurchaseProductReturn PRIMARY KEY ([Id]);
  IF NOT EXISTS (SELECT 1 FROM sys.default_constraints WHERE name = N'DF_PurchaseProductReturn_CreatedDate')
    ALTER TABLE dbo.[PurchaseProductReturn] ADD CONSTRAINT DF_PurchaseProductReturn_CreatedDate DEFAULT GETDATE() FOR [CreatedDate];
  IF NOT EXISTS (SELECT 1 FROM sys.default_constraints WHERE name = N'DF_PurchaseProductReturn_ModifiedDate')
    ALTER TABLE dbo.[PurchaseProductReturn] ADD CONSTRAINT DF_PurchaseProductReturn_ModifiedDate DEFAULT GETDATE() FOR [ModifiedDate];
  END
  INSERT INTO [SchemaMigration] ([MigrationName], [Batch]) VALUES (N'2018_12_26_144708_create_purchase_product_return_table', 68);
END
GO

-- MIGRATION: 2018_12_27_110018_create_departments_table
IF NOT EXISTS (SELECT 1 FROM [SchemaMigration] WHERE [MigrationName] = N'2018_12_27_110018_create_departments_table')
BEGIN
  IF OBJECT_ID(N'dbo.[Department]', N'U') IS NULL
  BEGIN
  CREATE TABLE dbo.[Department] (
    [Id] INT IDENTITY(1,1) NOT NULL,
    [Name] NVARCHAR(191) NOT NULL,
    [IsActive] BIT NOT NULL,
    [CreatedDate] DATETIME2 NULL,
    [ModifiedDate] DATETIME2 NULL
  );
  ALTER TABLE dbo.[Department] ADD CONSTRAINT PK_Department PRIMARY KEY ([Id]);
  IF NOT EXISTS (SELECT 1 FROM sys.default_constraints WHERE name = N'DF_Department_CreatedDate')
    ALTER TABLE dbo.[Department] ADD CONSTRAINT DF_Department_CreatedDate DEFAULT GETDATE() FOR [CreatedDate];
  IF NOT EXISTS (SELECT 1 FROM sys.default_constraints WHERE name = N'DF_Department_ModifiedDate')
    ALTER TABLE dbo.[Department] ADD CONSTRAINT DF_Department_ModifiedDate DEFAULT GETDATE() FOR [ModifiedDate];
  END
  INSERT INTO [SchemaMigration] ([MigrationName], [Batch]) VALUES (N'2018_12_27_110018_create_departments_table', 69);
END
GO

-- MIGRATION: 2018_12_30_054844_create_employees_table
IF NOT EXISTS (SELECT 1 FROM [SchemaMigration] WHERE [MigrationName] = N'2018_12_30_054844_create_employees_table')
BEGIN
  IF OBJECT_ID(N'dbo.[Employee]', N'U') IS NULL
  BEGIN
  CREATE TABLE dbo.[Employee] (
    [Id] INT IDENTITY(1,1) NOT NULL,
    [Name] NVARCHAR(191) NOT NULL,
    [Email] NVARCHAR(191) NOT NULL,
    [PhoneNumber] NVARCHAR(191) NOT NULL,
    [UserId] INT NULL,
    [Image] NVARCHAR(191) NULL,
    [Address] NVARCHAR(191) NULL,
    [City] NVARCHAR(191) NULL,
    [Country] NVARCHAR(191) NULL,
    [IsActive] BIT NOT NULL,
    [CreatedDate] DATETIME2 NULL,
    [ModifiedDate] DATETIME2 NULL
  );
  ALTER TABLE dbo.[Employee] ADD CONSTRAINT PK_Employee PRIMARY KEY ([Id]);
  IF NOT EXISTS (SELECT 1 FROM sys.default_constraints WHERE name = N'DF_Employee_CreatedDate')
    ALTER TABLE dbo.[Employee] ADD CONSTRAINT DF_Employee_CreatedDate DEFAULT GETDATE() FOR [CreatedDate];
  IF NOT EXISTS (SELECT 1 FROM sys.default_constraints WHERE name = N'DF_Employee_ModifiedDate')
    ALTER TABLE dbo.[Employee] ADD CONSTRAINT DF_Employee_ModifiedDate DEFAULT GETDATE() FOR [ModifiedDate];
  END
  INSERT INTO [SchemaMigration] ([MigrationName], [Batch]) VALUES (N'2018_12_30_054844_create_employees_table', 70);
END
GO

-- MIGRATION: 2018_12_31_125210_create_payrolls_table
IF NOT EXISTS (SELECT 1 FROM [SchemaMigration] WHERE [MigrationName] = N'2018_12_31_125210_create_payrolls_table')
BEGIN
  IF OBJECT_ID(N'dbo.[Payroll]', N'U') IS NULL
  BEGIN
  CREATE TABLE dbo.[Payroll] (
    [Id] INT IDENTITY(1,1) NOT NULL,
    [ReferenceNo] NVARCHAR(191) NOT NULL,
    [EmployeeId] INT NOT NULL,
    [AccountId] INT NOT NULL,
    [UserId] INT NOT NULL,
    [Amount] FLOAT NOT NULL,
    [PayingMethod] NVARCHAR(191) NOT NULL,
    [Note] NVARCHAR(MAX) NULL,
    [CreatedDate] DATETIME2 NULL,
    [ModifiedDate] DATETIME2 NULL
  );
  ALTER TABLE dbo.[Payroll] ADD CONSTRAINT PK_Payroll PRIMARY KEY ([Id]);
  IF NOT EXISTS (SELECT 1 FROM sys.default_constraints WHERE name = N'DF_Payroll_CreatedDate')
    ALTER TABLE dbo.[Payroll] ADD CONSTRAINT DF_Payroll_CreatedDate DEFAULT GETDATE() FOR [CreatedDate];
  IF NOT EXISTS (SELECT 1 FROM sys.default_constraints WHERE name = N'DF_Payroll_ModifiedDate')
    ALTER TABLE dbo.[Payroll] ADD CONSTRAINT DF_Payroll_ModifiedDate DEFAULT GETDATE() FOR [ModifiedDate];
  END
  INSERT INTO [SchemaMigration] ([MigrationName], [Batch]) VALUES (N'2018_12_31_125210_create_payrolls_table', 71);
END
GO

-- MIGRATION: 2018_12_31_150446_add_department_id_to_employees_table
IF NOT EXISTS (SELECT 1 FROM [SchemaMigration] WHERE [MigrationName] = N'2018_12_31_150446_add_department_id_to_employees_table')
BEGIN
  IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'dbo.[Employee]') AND name = N'DepartmentId')
  ALTER TABLE dbo.[Employee] ADD [DepartmentId] INT NOT NULL;
  INSERT INTO [SchemaMigration] ([MigrationName], [Batch]) VALUES (N'2018_12_31_150446_add_department_id_to_employees_table', 72);
END
GO

-- MIGRATION: 2019_01_01_062708_add_user_id_to_expenses_table
IF NOT EXISTS (SELECT 1 FROM [SchemaMigration] WHERE [MigrationName] = N'2019_01_01_062708_add_user_id_to_expenses_table')
BEGIN
  IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'dbo.[Expense]') AND name = N'UserId')
  ALTER TABLE dbo.[Expense] ADD [UserId] INT NOT NULL;
  INSERT INTO [SchemaMigration] ([MigrationName], [Batch]) VALUES (N'2019_01_01_062708_add_user_id_to_expenses_table', 73);
END
GO

-- MIGRATION: 2019_01_02_075644_create_hrm_settings_table
IF NOT EXISTS (SELECT 1 FROM [SchemaMigration] WHERE [MigrationName] = N'2019_01_02_075644_create_hrm_settings_table')
BEGIN
  IF OBJECT_ID(N'dbo.[HrmSetting]', N'U') IS NULL
  BEGIN
  CREATE TABLE dbo.[HrmSetting] (
    [Id] INT IDENTITY(1,1) NOT NULL,
    [Checkin] NVARCHAR(191) NOT NULL,
    [Checkout] NVARCHAR(191) NOT NULL,
    [CreatedDate] DATETIME2 NULL,
    [ModifiedDate] DATETIME2 NULL
  );
  ALTER TABLE dbo.[HrmSetting] ADD CONSTRAINT PK_HrmSetting PRIMARY KEY ([Id]);
  IF NOT EXISTS (SELECT 1 FROM sys.default_constraints WHERE name = N'DF_HrmSetting_CreatedDate')
    ALTER TABLE dbo.[HrmSetting] ADD CONSTRAINT DF_HrmSetting_CreatedDate DEFAULT GETDATE() FOR [CreatedDate];
  IF NOT EXISTS (SELECT 1 FROM sys.default_constraints WHERE name = N'DF_HrmSetting_ModifiedDate')
    ALTER TABLE dbo.[HrmSetting] ADD CONSTRAINT DF_HrmSetting_ModifiedDate DEFAULT GETDATE() FOR [ModifiedDate];
  END
  INSERT INTO [SchemaMigration] ([MigrationName], [Batch]) VALUES (N'2019_01_02_075644_create_hrm_settings_table', 74);
END
GO

-- MIGRATION: 2019_01_02_090334_create_attendances_table
IF NOT EXISTS (SELECT 1 FROM [SchemaMigration] WHERE [MigrationName] = N'2019_01_02_090334_create_attendances_table')
BEGIN
  IF OBJECT_ID(N'dbo.[Attendance]', N'U') IS NULL
  BEGIN
  CREATE TABLE dbo.[Attendance] (
    [Id] INT IDENTITY(1,1) NOT NULL,
    [Date] DATE NOT NULL,
    [EmployeeId] INT NOT NULL,
    [UserId] INT NOT NULL,
    [Checkin] NVARCHAR(191) NOT NULL,
    [Checkout] NVARCHAR(191) NOT NULL,
    [Status] INT NOT NULL,
    [Note] NVARCHAR(MAX) NULL,
    [CreatedDate] DATETIME2 NULL,
    [ModifiedDate] DATETIME2 NULL
  );
  ALTER TABLE dbo.[Attendance] ADD CONSTRAINT PK_Attendance PRIMARY KEY ([Id]);
  IF NOT EXISTS (SELECT 1 FROM sys.default_constraints WHERE name = N'DF_Attendance_CreatedDate')
    ALTER TABLE dbo.[Attendance] ADD CONSTRAINT DF_Attendance_CreatedDate DEFAULT GETDATE() FOR [CreatedDate];
  IF NOT EXISTS (SELECT 1 FROM sys.default_constraints WHERE name = N'DF_Attendance_ModifiedDate')
    ALTER TABLE dbo.[Attendance] ADD CONSTRAINT DF_Attendance_ModifiedDate DEFAULT GETDATE() FOR [ModifiedDate];
  END
  INSERT INTO [SchemaMigration] ([MigrationName], [Batch]) VALUES (N'2019_01_02_090334_create_attendances_table', 75);
END
GO

-- MIGRATION: 2019_01_27_160956_add_three_columns_to_general_settings_table
IF NOT EXISTS (SELECT 1 FROM [SchemaMigration] WHERE [MigrationName] = N'2019_01_27_160956_add_three_columns_to_general_settings_table')
BEGIN
  IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'dbo.[GeneralSetting]') AND name = N'StaffAccess')
  ALTER TABLE dbo.[GeneralSetting] ADD [StaffAccess] NVARCHAR(191) NOT NULL;
  IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'dbo.[GeneralSetting]') AND name = N'DateFormat')
  ALTER TABLE dbo.[GeneralSetting] ADD [DateFormat] NVARCHAR(191) NOT NULL;
  IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'dbo.[GeneralSetting]') AND name = N'Theme')
  ALTER TABLE dbo.[GeneralSetting] ADD [Theme] NVARCHAR(191) NOT NULL;
  INSERT INTO [SchemaMigration] ([MigrationName], [Batch]) VALUES (N'2019_01_27_160956_add_three_columns_to_general_settings_table', 76);
END
GO

-- MIGRATION: 2019_02_15_183303_create_stock_counts_table
IF NOT EXISTS (SELECT 1 FROM [SchemaMigration] WHERE [MigrationName] = N'2019_02_15_183303_create_stock_counts_table')
BEGIN
  IF OBJECT_ID(N'dbo.[StockCount]', N'U') IS NULL
  BEGIN
  CREATE TABLE dbo.[StockCount] (
    [Id] INT IDENTITY(1,1) NOT NULL,
    [ReferenceNo] NVARCHAR(191) NOT NULL,
    [WarehouseId] INT NOT NULL,
    [CategoryId] NVARCHAR(191) NULL,
    [BrandId] NVARCHAR(191) NULL,
    [UserId] INT NOT NULL,
    [Type] NVARCHAR(191) NOT NULL,
    [InitialFile] NVARCHAR(191) NULL,
    [FinalFile] NVARCHAR(191) NULL,
    [Note] NVARCHAR(MAX) NULL,
    [CreatedDate] DATETIME2 NULL,
    [ModifiedDate] DATETIME2 NULL
  );
  ALTER TABLE dbo.[StockCount] ADD CONSTRAINT PK_StockCount PRIMARY KEY ([Id]);
  IF NOT EXISTS (SELECT 1 FROM sys.default_constraints WHERE name = N'DF_StockCount_CreatedDate')
    ALTER TABLE dbo.[StockCount] ADD CONSTRAINT DF_StockCount_CreatedDate DEFAULT GETDATE() FOR [CreatedDate];
  IF NOT EXISTS (SELECT 1 FROM sys.default_constraints WHERE name = N'DF_StockCount_ModifiedDate')
    ALTER TABLE dbo.[StockCount] ADD CONSTRAINT DF_StockCount_ModifiedDate DEFAULT GETDATE() FOR [ModifiedDate];
  END
  INSERT INTO [SchemaMigration] ([MigrationName], [Batch]) VALUES (N'2019_02_15_183303_create_stock_counts_table', 77);
END
GO

-- MIGRATION: 2019_02_17_101604_add_is_adjusted_to_stock_counts_table
IF NOT EXISTS (SELECT 1 FROM [SchemaMigration] WHERE [MigrationName] = N'2019_02_17_101604_add_is_adjusted_to_stock_counts_table')
BEGIN
  IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'dbo.[StockCount]') AND name = N'IsAdjusted')
  ALTER TABLE dbo.[StockCount] ADD [IsAdjusted] BIT NOT NULL;
  INSERT INTO [SchemaMigration] ([MigrationName], [Batch]) VALUES (N'2019_02_17_101604_add_is_adjusted_to_stock_counts_table', 78);
END
GO

-- MIGRATION: 2019_04_13_101707_add_tax_no_to_customers_table
IF NOT EXISTS (SELECT 1 FROM [SchemaMigration] WHERE [MigrationName] = N'2019_04_13_101707_add_tax_no_to_customers_table')
BEGIN
  IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'dbo.[Customer]') AND name = N'TaxNo')
  ALTER TABLE dbo.[Customer] ADD [TaxNo] NVARCHAR(191) NULL;
  INSERT INTO [SchemaMigration] ([MigrationName], [Batch]) VALUES (N'2019_04_13_101707_add_tax_no_to_customers_table', 79);
END
GO

-- MIGRATION: 2019_08_19_000000_create_failed_jobs_table
IF NOT EXISTS (SELECT 1 FROM [SchemaMigration] WHERE [MigrationName] = N'2019_08_19_000000_create_failed_jobs_table')
BEGIN
  IF OBJECT_ID(N'dbo.[FailedJob]', N'U') IS NULL
  BEGIN
  CREATE TABLE dbo.[FailedJob] (
    [Id] BIGINT IDENTITY(1,1) NOT NULL,
    [Connection] NVARCHAR(MAX) NOT NULL,
    [Queue] NVARCHAR(MAX) NOT NULL,
    [Payload] NVARCHAR(MAX) NOT NULL,
    [Exception] NVARCHAR(MAX) NOT NULL,
    [FailedAt] DATETIME2 NOT NULL
  );
  ALTER TABLE dbo.[FailedJob] ADD CONSTRAINT PK_FailedJob PRIMARY KEY ([Id]);
  END
  INSERT INTO [SchemaMigration] ([MigrationName], [Batch]) VALUES (N'2019_08_19_000000_create_failed_jobs_table', 80);
END
GO

-- MIGRATION: 2019_10_14_111455_create_holidays_table
IF NOT EXISTS (SELECT 1 FROM [SchemaMigration] WHERE [MigrationName] = N'2019_10_14_111455_create_holidays_table')
BEGIN
  IF OBJECT_ID(N'dbo.[Holiday]', N'U') IS NULL
  BEGIN
  CREATE TABLE dbo.[Holiday] (
    [Id] INT IDENTITY(1,1) NOT NULL,
    [UserId] INT NOT NULL,
    [FromDate] DATE NOT NULL,
    [ToDate] DATE NOT NULL,
    [Note] NVARCHAR(MAX) NULL,
    [IsApproved] BIT NOT NULL,
    [CreatedDate] DATETIME2 NULL,
    [ModifiedDate] DATETIME2 NULL
  );
  ALTER TABLE dbo.[Holiday] ADD CONSTRAINT PK_Holiday PRIMARY KEY ([Id]);
  IF NOT EXISTS (SELECT 1 FROM sys.default_constraints WHERE name = N'DF_Holiday_CreatedDate')
    ALTER TABLE dbo.[Holiday] ADD CONSTRAINT DF_Holiday_CreatedDate DEFAULT GETDATE() FOR [CreatedDate];
  IF NOT EXISTS (SELECT 1 FROM sys.default_constraints WHERE name = N'DF_Holiday_ModifiedDate')
    ALTER TABLE dbo.[Holiday] ADD CONSTRAINT DF_Holiday_ModifiedDate DEFAULT GETDATE() FOR [ModifiedDate];
  END
  INSERT INTO [SchemaMigration] ([MigrationName], [Batch]) VALUES (N'2019_10_14_111455_create_holidays_table', 81);
END
GO

-- MIGRATION: 2019_11_13_145619_add_is_variant_to_products_table
IF NOT EXISTS (SELECT 1 FROM [SchemaMigration] WHERE [MigrationName] = N'2019_11_13_145619_add_is_variant_to_products_table')
BEGIN
  IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'dbo.[Product]') AND name = N'IsVariant')
  ALTER TABLE dbo.[Product] ADD [IsVariant] BIT NULL;
  INSERT INTO [SchemaMigration] ([MigrationName], [Batch]) VALUES (N'2019_11_13_145619_add_is_variant_to_products_table', 82);
END
GO

-- MIGRATION: 2019_11_13_150206_create_product_variants_table
IF NOT EXISTS (SELECT 1 FROM [SchemaMigration] WHERE [MigrationName] = N'2019_11_13_150206_create_product_variants_table')
BEGIN
  IF OBJECT_ID(N'dbo.[ProductVariant]', N'U') IS NULL
  BEGIN
  CREATE TABLE dbo.[ProductVariant] (
    [Id] INT IDENTITY(1,1) NOT NULL,
    [ProductId] INT NOT NULL,
    [VariantId] INT NOT NULL,
    [Position] INT NOT NULL,
    [ItemCode] NVARCHAR(191) NOT NULL,
    [AdditionalPrice] FLOAT NULL,
    [CreatedDate] DATETIME2 NULL,
    [ModifiedDate] DATETIME2 NULL
  );
  ALTER TABLE dbo.[ProductVariant] ADD CONSTRAINT PK_ProductVariant PRIMARY KEY ([Id]);
  IF NOT EXISTS (SELECT 1 FROM sys.default_constraints WHERE name = N'DF_ProductVariant_CreatedDate')
    ALTER TABLE dbo.[ProductVariant] ADD CONSTRAINT DF_ProductVariant_CreatedDate DEFAULT GETDATE() FOR [CreatedDate];
  IF NOT EXISTS (SELECT 1 FROM sys.default_constraints WHERE name = N'DF_ProductVariant_ModifiedDate')
    ALTER TABLE dbo.[ProductVariant] ADD CONSTRAINT DF_ProductVariant_ModifiedDate DEFAULT GETDATE() FOR [ModifiedDate];
  END
  INSERT INTO [SchemaMigration] ([MigrationName], [Batch]) VALUES (N'2019_11_13_150206_create_product_variants_table', 83);
END
GO

-- MIGRATION: 2019_11_13_153828_create_variants_table
IF NOT EXISTS (SELECT 1 FROM [SchemaMigration] WHERE [MigrationName] = N'2019_11_13_153828_create_variants_table')
BEGIN
  IF OBJECT_ID(N'dbo.[Variant]', N'U') IS NULL
  BEGIN
  CREATE TABLE dbo.[Variant] (
    [Id] INT IDENTITY(1,1) NOT NULL,
    [Name] NVARCHAR(191) NOT NULL,
    [CreatedDate] DATETIME2 NULL,
    [ModifiedDate] DATETIME2 NULL
  );
  ALTER TABLE dbo.[Variant] ADD CONSTRAINT PK_Variant PRIMARY KEY ([Id]);
  IF NOT EXISTS (SELECT 1 FROM sys.default_constraints WHERE name = N'DF_Variant_CreatedDate')
    ALTER TABLE dbo.[Variant] ADD CONSTRAINT DF_Variant_CreatedDate DEFAULT GETDATE() FOR [CreatedDate];
  IF NOT EXISTS (SELECT 1 FROM sys.default_constraints WHERE name = N'DF_Variant_ModifiedDate')
    ALTER TABLE dbo.[Variant] ADD CONSTRAINT DF_Variant_ModifiedDate DEFAULT GETDATE() FOR [ModifiedDate];
  END
  INSERT INTO [SchemaMigration] ([MigrationName], [Batch]) VALUES (N'2019_11_13_153828_create_variants_table', 84);
END
GO

-- MIGRATION: 2019_11_25_134041_add_qty_to_product_variants_table
IF NOT EXISTS (SELECT 1 FROM [SchemaMigration] WHERE [MigrationName] = N'2019_11_25_134041_add_qty_to_product_variants_table')
BEGIN
  IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'dbo.[ProductVariant]') AND name = N'Qty')
  ALTER TABLE dbo.[ProductVariant] ADD [Qty] FLOAT NOT NULL;
  INSERT INTO [SchemaMigration] ([MigrationName], [Batch]) VALUES (N'2019_11_25_134041_add_qty_to_product_variants_table', 85);
END
GO

-- MIGRATION: 2019_11_25_134922_add_variant_id_to_product_purchases_table
IF NOT EXISTS (SELECT 1 FROM [SchemaMigration] WHERE [MigrationName] = N'2019_11_25_134922_add_variant_id_to_product_purchases_table')
BEGIN
  IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'dbo.[ProductPurchase]') AND name = N'VariantId')
  ALTER TABLE dbo.[ProductPurchase] ADD [VariantId] INT NULL;
  INSERT INTO [SchemaMigration] ([MigrationName], [Batch]) VALUES (N'2019_11_25_134922_add_variant_id_to_product_purchases_table', 86);
END
GO

-- MIGRATION: 2019_11_25_145341_add_variant_id_to_product_warehouse_table
IF NOT EXISTS (SELECT 1 FROM [SchemaMigration] WHERE [MigrationName] = N'2019_11_25_145341_add_variant_id_to_product_warehouse_table')
BEGIN
  IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'dbo.[ProductWarehouse]') AND name = N'VariantId')
  ALTER TABLE dbo.[ProductWarehouse] ADD [VariantId] INT NULL;
  INSERT INTO [SchemaMigration] ([MigrationName], [Batch]) VALUES (N'2019_11_25_145341_add_variant_id_to_product_warehouse_table', 87);
END
GO

-- MIGRATION: 2019_11_29_182201_add_variant_id_to_product_sales_table
IF NOT EXISTS (SELECT 1 FROM [SchemaMigration] WHERE [MigrationName] = N'2019_11_29_182201_add_variant_id_to_product_sales_table')
BEGIN
  IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'dbo.[ProductSale]') AND name = N'VariantId')
  ALTER TABLE dbo.[ProductSale] ADD [VariantId] INT NULL;
  INSERT INTO [SchemaMigration] ([MigrationName], [Batch]) VALUES (N'2019_11_29_182201_add_variant_id_to_product_sales_table', 88);
END
GO

-- MIGRATION: 2019_12_04_121311_add_variant_id_to_product_quotation_table
IF NOT EXISTS (SELECT 1 FROM [SchemaMigration] WHERE [MigrationName] = N'2019_12_04_121311_add_variant_id_to_product_quotation_table')
BEGIN
  IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'dbo.[ProductQuotation]') AND name = N'VariantId')
  ALTER TABLE dbo.[ProductQuotation] ADD [VariantId] INT NULL;
  INSERT INTO [SchemaMigration] ([MigrationName], [Batch]) VALUES (N'2019_12_04_121311_add_variant_id_to_product_quotation_table', 89);
END
GO

-- MIGRATION: 2019_12_05_123802_add_variant_id_to_product_transfer_table
IF NOT EXISTS (SELECT 1 FROM [SchemaMigration] WHERE [MigrationName] = N'2019_12_05_123802_add_variant_id_to_product_transfer_table')
BEGIN
  IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'dbo.[ProductTransfer]') AND name = N'VariantId')
  ALTER TABLE dbo.[ProductTransfer] ADD [VariantId] INT NULL;
  INSERT INTO [SchemaMigration] ([MigrationName], [Batch]) VALUES (N'2019_12_05_123802_add_variant_id_to_product_transfer_table', 90);
END
GO

-- MIGRATION: 2019_12_08_114954_add_variant_id_to_product_returns_table
IF NOT EXISTS (SELECT 1 FROM [SchemaMigration] WHERE [MigrationName] = N'2019_12_08_114954_add_variant_id_to_product_returns_table')
BEGIN
  IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'dbo.[ProductReturn]') AND name = N'VariantId')
  ALTER TABLE dbo.[ProductReturn] ADD [VariantId] INT NULL;
  INSERT INTO [SchemaMigration] ([MigrationName], [Batch]) VALUES (N'2019_12_08_114954_add_variant_id_to_product_returns_table', 91);
END
GO

-- MIGRATION: 2019_12_08_203146_add_variant_id_to_purchase_product_return_table
IF NOT EXISTS (SELECT 1 FROM [SchemaMigration] WHERE [MigrationName] = N'2019_12_08_203146_add_variant_id_to_purchase_product_return_table')
BEGIN
  IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'dbo.[PurchaseProductReturn]') AND name = N'VariantId')
  ALTER TABLE dbo.[PurchaseProductReturn] ADD [VariantId] INT NULL;
  INSERT INTO [SchemaMigration] ([MigrationName], [Batch]) VALUES (N'2019_12_08_203146_add_variant_id_to_purchase_product_return_table', 92);
END
GO

-- MIGRATION: 2020_02_28_103340_create_money_transfers_table
IF NOT EXISTS (SELECT 1 FROM [SchemaMigration] WHERE [MigrationName] = N'2020_02_28_103340_create_money_transfers_table')
BEGIN
  IF OBJECT_ID(N'dbo.[MoneyTransfer]', N'U') IS NULL
  BEGIN
  CREATE TABLE dbo.[MoneyTransfer] (
    [Id] INT IDENTITY(1,1) NOT NULL,
    [ReferenceNo] NVARCHAR(191) NOT NULL,
    [FromAccountId] INT NOT NULL,
    [ToAccountId] INT NOT NULL,
    [Amount] FLOAT NOT NULL,
    [CreatedDate] DATETIME2 NULL,
    [ModifiedDate] DATETIME2 NULL
  );
  ALTER TABLE dbo.[MoneyTransfer] ADD CONSTRAINT PK_MoneyTransfer PRIMARY KEY ([Id]);
  IF NOT EXISTS (SELECT 1 FROM sys.default_constraints WHERE name = N'DF_MoneyTransfer_CreatedDate')
    ALTER TABLE dbo.[MoneyTransfer] ADD CONSTRAINT DF_MoneyTransfer_CreatedDate DEFAULT GETDATE() FOR [CreatedDate];
  IF NOT EXISTS (SELECT 1 FROM sys.default_constraints WHERE name = N'DF_MoneyTransfer_ModifiedDate')
    ALTER TABLE dbo.[MoneyTransfer] ADD CONSTRAINT DF_MoneyTransfer_ModifiedDate DEFAULT GETDATE() FOR [ModifiedDate];
  END
  INSERT INTO [SchemaMigration] ([MigrationName], [Batch]) VALUES (N'2020_02_28_103340_create_money_transfers_table', 93);
END
GO

-- MIGRATION: 2020_07_01_193151_add_image_to_categories_table
IF NOT EXISTS (SELECT 1 FROM [SchemaMigration] WHERE [MigrationName] = N'2020_07_01_193151_add_image_to_categories_table')
BEGIN
  IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'dbo.[Category]') AND name = N'Image')
  ALTER TABLE dbo.[Category] ADD [Image] NVARCHAR(191) NULL;
  INSERT INTO [SchemaMigration] ([MigrationName], [Batch]) VALUES (N'2020_07_01_193151_add_image_to_categories_table', 94);
END
GO

-- MIGRATION: 2020_09_26_130426_add_user_id_to_deliveries_table
IF NOT EXISTS (SELECT 1 FROM [SchemaMigration] WHERE [MigrationName] = N'2020_09_26_130426_add_user_id_to_deliveries_table')
BEGIN
  IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'dbo.[Delivery]') AND name = N'UserId')
  ALTER TABLE dbo.[Delivery] ADD [UserId] INT NULL;
  INSERT INTO [SchemaMigration] ([MigrationName], [Batch]) VALUES (N'2020_09_26_130426_add_user_id_to_deliveries_table', 95);
END
GO

-- MIGRATION: 2020_10_11_125457_create_cash_registers_table
IF NOT EXISTS (SELECT 1 FROM [SchemaMigration] WHERE [MigrationName] = N'2020_10_11_125457_create_cash_registers_table')
BEGIN
  IF OBJECT_ID(N'dbo.[CashRegister]', N'U') IS NULL
  BEGIN
  CREATE TABLE dbo.[CashRegister] (
    [Id] INT IDENTITY(1,1) NOT NULL,
    [CashInHand] FLOAT NOT NULL,
    [UserId] INT NOT NULL,
    [WarehouseId] INT NOT NULL,
    [Status] BIT NOT NULL,
    [CreatedDate] DATETIME2 NULL,
    [ModifiedDate] DATETIME2 NULL
  );
  ALTER TABLE dbo.[CashRegister] ADD CONSTRAINT PK_CashRegister PRIMARY KEY ([Id]);
  IF NOT EXISTS (SELECT 1 FROM sys.default_constraints WHERE name = N'DF_CashRegister_CreatedDate')
    ALTER TABLE dbo.[CashRegister] ADD CONSTRAINT DF_CashRegister_CreatedDate DEFAULT GETDATE() FOR [CreatedDate];
  IF NOT EXISTS (SELECT 1 FROM sys.default_constraints WHERE name = N'DF_CashRegister_ModifiedDate')
    ALTER TABLE dbo.[CashRegister] ADD CONSTRAINT DF_CashRegister_ModifiedDate DEFAULT GETDATE() FOR [ModifiedDate];
  END
  INSERT INTO [SchemaMigration] ([MigrationName], [Batch]) VALUES (N'2020_10_11_125457_create_cash_registers_table', 96);
END
GO

-- MIGRATION: 2020_10_13_155019_add_cash_register_id_to_sales_table
IF NOT EXISTS (SELECT 1 FROM [SchemaMigration] WHERE [MigrationName] = N'2020_10_13_155019_add_cash_register_id_to_sales_table')
BEGIN
  IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'dbo.[Sale]') AND name = N'CashRegisterId')
  ALTER TABLE dbo.[Sale] ADD [CashRegisterId] INT NULL;
  INSERT INTO [SchemaMigration] ([MigrationName], [Batch]) VALUES (N'2020_10_13_155019_add_cash_register_id_to_sales_table', 97);
END
GO

-- MIGRATION: 2020_10_13_172624_add_cash_register_id_to_returns_table
IF NOT EXISTS (SELECT 1 FROM [SchemaMigration] WHERE [MigrationName] = N'2020_10_13_172624_add_cash_register_id_to_returns_table')
BEGIN
  IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'dbo.[SaleReturn]') AND name = N'CashRegisterId')
  ALTER TABLE dbo.[SaleReturn] ADD [CashRegisterId] INT NULL;
  INSERT INTO [SchemaMigration] ([MigrationName], [Batch]) VALUES (N'2020_10_13_172624_add_cash_register_id_to_returns_table', 98);
END
GO

-- MIGRATION: 2020_10_17_212338_add_cash_register_id_to_payments_table
IF NOT EXISTS (SELECT 1 FROM [SchemaMigration] WHERE [MigrationName] = N'2020_10_17_212338_add_cash_register_id_to_payments_table')
BEGIN
  IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'dbo.[Payment]') AND name = N'CashRegisterId')
  ALTER TABLE dbo.[Payment] ADD [CashRegisterId] INT NULL;
  INSERT INTO [SchemaMigration] ([MigrationName], [Batch]) VALUES (N'2020_10_17_212338_add_cash_register_id_to_payments_table', 99);
END
GO

-- MIGRATION: 2020_10_18_124200_add_cash_register_id_to_expenses_table
IF NOT EXISTS (SELECT 1 FROM [SchemaMigration] WHERE [MigrationName] = N'2020_10_18_124200_add_cash_register_id_to_expenses_table')
BEGIN
  IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'dbo.[Expense]') AND name = N'CashRegisterId')
  ALTER TABLE dbo.[Expense] ADD [CashRegisterId] INT NULL;
  INSERT INTO [SchemaMigration] ([MigrationName], [Batch]) VALUES (N'2020_10_18_124200_add_cash_register_id_to_expenses_table', 100);
END
GO

-- MIGRATION: 2020_10_21_121632_add_developed_by_to_general_settings_table
IF NOT EXISTS (SELECT 1 FROM [SchemaMigration] WHERE [MigrationName] = N'2020_10_21_121632_add_developed_by_to_general_settings_table')
BEGIN
  IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'dbo.[GeneralSetting]') AND name = N'DevelopedBy')
  ALTER TABLE dbo.[GeneralSetting] ADD [DevelopedBy] NVARCHAR(191) NULL;
  INSERT INTO [SchemaMigration] ([MigrationName], [Batch]) VALUES (N'2020_10_21_121632_add_developed_by_to_general_settings_table', 101);
END
GO

-- MIGRATION: 2020_10_30_135557_create_notifications_table
IF NOT EXISTS (SELECT 1 FROM [SchemaMigration] WHERE [MigrationName] = N'2020_10_30_135557_create_notifications_table')
BEGIN
  IF OBJECT_ID(N'dbo.[Notification]', N'U') IS NULL
  BEGIN
  CREATE TABLE dbo.[Notification] (
    [Id] NVARCHAR(36) NOT NULL,
    [Type] NVARCHAR(191) NOT NULL,
    [NotifiableId] BIGINT NOT NULL,
    [NotifiableType] NVARCHAR(191) NOT NULL,
    [Data] NVARCHAR(MAX) NOT NULL,
    [ReadAt] DATETIME2 NULL,
    [CreatedDate] DATETIME2 NULL,
    [ModifiedDate] DATETIME2 NULL
  );
  ALTER TABLE dbo.[Notification] ADD CONSTRAINT PK_Notification PRIMARY KEY ([Id]);
  IF NOT EXISTS (SELECT 1 FROM sys.default_constraints WHERE name = N'DF_Notification_CreatedDate')
    ALTER TABLE dbo.[Notification] ADD CONSTRAINT DF_Notification_CreatedDate DEFAULT GETDATE() FOR [CreatedDate];
  IF NOT EXISTS (SELECT 1 FROM sys.default_constraints WHERE name = N'DF_Notification_ModifiedDate')
    ALTER TABLE dbo.[Notification] ADD CONSTRAINT DF_Notification_ModifiedDate DEFAULT GETDATE() FOR [ModifiedDate];
  END
  INSERT INTO [SchemaMigration] ([MigrationName], [Batch]) VALUES (N'2020_10_30_135557_create_notifications_table', 102);
END
GO

-- MIGRATION: 2020_11_01_044954_create_currencies_table
IF NOT EXISTS (SELECT 1 FROM [SchemaMigration] WHERE [MigrationName] = N'2020_11_01_044954_create_currencies_table')
BEGIN
  IF OBJECT_ID(N'dbo.[Currency]', N'U') IS NULL
  BEGIN
  CREATE TABLE dbo.[Currency] (
    [Id] BIGINT IDENTITY(1,1) NOT NULL,
    [Name] NVARCHAR(191) NOT NULL,
    [Code] NVARCHAR(191) NOT NULL,
    [ExchangeRate] FLOAT NOT NULL,
    [CreatedDate] DATETIME2 NULL,
    [ModifiedDate] DATETIME2 NULL
  );
  ALTER TABLE dbo.[Currency] ADD CONSTRAINT PK_Currency PRIMARY KEY ([Id]);
  IF NOT EXISTS (SELECT 1 FROM sys.default_constraints WHERE name = N'DF_Currency_CreatedDate')
    ALTER TABLE dbo.[Currency] ADD CONSTRAINT DF_Currency_CreatedDate DEFAULT GETDATE() FOR [CreatedDate];
  IF NOT EXISTS (SELECT 1 FROM sys.default_constraints WHERE name = N'DF_Currency_ModifiedDate')
    ALTER TABLE dbo.[Currency] ADD CONSTRAINT DF_Currency_ModifiedDate DEFAULT GETDATE() FOR [ModifiedDate];
  END
  INSERT INTO [SchemaMigration] ([MigrationName], [Batch]) VALUES (N'2020_11_01_044954_create_currencies_table', 103);
END
GO

-- MIGRATION: 2020_11_01_140736_add_price_to_product_warehouse_table
IF NOT EXISTS (SELECT 1 FROM [SchemaMigration] WHERE [MigrationName] = N'2020_11_01_140736_add_price_to_product_warehouse_table')
BEGIN
  IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'dbo.[ProductWarehouse]') AND name = N'Price')
  ALTER TABLE dbo.[ProductWarehouse] ADD [Price] FLOAT NULL;
  INSERT INTO [SchemaMigration] ([MigrationName], [Batch]) VALUES (N'2020_11_01_140736_add_price_to_product_warehouse_table', 104);
END
GO

-- MIGRATION: 2020_11_02_050633_add_is_diff_price_to_products_table
IF NOT EXISTS (SELECT 1 FROM [SchemaMigration] WHERE [MigrationName] = N'2020_11_02_050633_add_is_diff_price_to_products_table')
BEGIN
  IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'dbo.[Product]') AND name = N'IsDiffprice')
  ALTER TABLE dbo.[Product] ADD [IsDiffprice] BIT NULL;
  INSERT INTO [SchemaMigration] ([MigrationName], [Batch]) VALUES (N'2020_11_02_050633_add_is_diff_price_to_products_table', 105);
END
GO

-- MIGRATION: 2020_11_09_055222_add_user_id_to_customers_table
IF NOT EXISTS (SELECT 1 FROM [SchemaMigration] WHERE [MigrationName] = N'2020_11_09_055222_add_user_id_to_customers_table')
BEGIN
  IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'dbo.[Customer]') AND name = N'UserId')
  ALTER TABLE dbo.[Customer] ADD [UserId] INT NULL;
  INSERT INTO [SchemaMigration] ([MigrationName], [Batch]) VALUES (N'2020_11_09_055222_add_user_id_to_customers_table', 106);
END
GO

-- MIGRATION: 2020_11_17_054806_add_invoice_format_to_general_settings_table
IF NOT EXISTS (SELECT 1 FROM [SchemaMigration] WHERE [MigrationName] = N'2020_11_17_054806_add_invoice_format_to_general_settings_table')
BEGIN
  IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'dbo.[GeneralSetting]') AND name = N'InvoiceFormat')
  ALTER TABLE dbo.[GeneralSetting] ADD [InvoiceFormat] NVARCHAR(191) NULL;
  IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'dbo.[GeneralSetting]') AND name = N'State')
  ALTER TABLE dbo.[GeneralSetting] ADD [State] INT NULL;
  INSERT INTO [SchemaMigration] ([MigrationName], [Batch]) VALUES (N'2020_11_17_054806_add_invoice_format_to_general_settings_table', 107);
END
GO

-- MIGRATION: 2021_02_10_074859_add_variant_id_to_product_adjustments_table
IF NOT EXISTS (SELECT 1 FROM [SchemaMigration] WHERE [MigrationName] = N'2021_02_10_074859_add_variant_id_to_product_adjustments_table')
BEGIN
  IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'dbo.[ProductAdjustment]') AND name = N'VariantId')
  ALTER TABLE dbo.[ProductAdjustment] ADD [VariantId] INT NULL;
  INSERT INTO [SchemaMigration] ([MigrationName], [Batch]) VALUES (N'2021_02_10_074859_add_variant_id_to_product_adjustments_table', 108);
END
GO

-- MIGRATION: 2021_03_07_093606_create_product_batches_table
IF NOT EXISTS (SELECT 1 FROM [SchemaMigration] WHERE [MigrationName] = N'2021_03_07_093606_create_product_batches_table')
BEGIN
  IF OBJECT_ID(N'dbo.[ProductBatch]', N'U') IS NULL
  BEGIN
  CREATE TABLE dbo.[ProductBatch] (
    [Id] BIGINT IDENTITY(1,1) NOT NULL,
    [ProductId] INT NOT NULL,
    [BatchNo] NVARCHAR(191) NOT NULL,
    [ExpiredDate] DATE NOT NULL,
    [Qty] FLOAT NOT NULL,
    [CreatedDate] DATETIME2 NULL,
    [ModifiedDate] DATETIME2 NULL
  );
  ALTER TABLE dbo.[ProductBatch] ADD CONSTRAINT PK_ProductBatch PRIMARY KEY ([Id]);
  IF NOT EXISTS (SELECT 1 FROM sys.default_constraints WHERE name = N'DF_ProductBatch_CreatedDate')
    ALTER TABLE dbo.[ProductBatch] ADD CONSTRAINT DF_ProductBatch_CreatedDate DEFAULT GETDATE() FOR [CreatedDate];
  IF NOT EXISTS (SELECT 1 FROM sys.default_constraints WHERE name = N'DF_ProductBatch_ModifiedDate')
    ALTER TABLE dbo.[ProductBatch] ADD CONSTRAINT DF_ProductBatch_ModifiedDate DEFAULT GETDATE() FOR [ModifiedDate];
  END
  INSERT INTO [SchemaMigration] ([MigrationName], [Batch]) VALUES (N'2021_03_07_093606_create_product_batches_table', 109);
END
GO

-- MIGRATION: 2021_03_07_093759_add_product_batch_id_to_product_warehouse_table
IF NOT EXISTS (SELECT 1 FROM [SchemaMigration] WHERE [MigrationName] = N'2021_03_07_093759_add_product_batch_id_to_product_warehouse_table')
BEGIN
  IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'dbo.[ProductWarehouse]') AND name = N'ProductBatchId')
  ALTER TABLE dbo.[ProductWarehouse] ADD [ProductBatchId] INT NULL;
  INSERT INTO [SchemaMigration] ([MigrationName], [Batch]) VALUES (N'2021_03_07_093759_add_product_batch_id_to_product_warehouse_table', 110);
END
GO

-- MIGRATION: 2021_03_07_093900_add_product_batch_id_to_product_purchases_table
IF NOT EXISTS (SELECT 1 FROM [SchemaMigration] WHERE [MigrationName] = N'2021_03_07_093900_add_product_batch_id_to_product_purchases_table')
BEGIN
  IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'dbo.[ProductPurchase]') AND name = N'ProductBatchId')
  ALTER TABLE dbo.[ProductPurchase] ADD [ProductBatchId] INT NULL;
  INSERT INTO [SchemaMigration] ([MigrationName], [Batch]) VALUES (N'2021_03_07_093900_add_product_batch_id_to_product_purchases_table', 111);
END
GO

-- MIGRATION: 2021_03_11_132603_add_product_batch_id_to_product_sales_table
IF NOT EXISTS (SELECT 1 FROM [SchemaMigration] WHERE [MigrationName] = N'2021_03_11_132603_add_product_batch_id_to_product_sales_table')
BEGIN
  IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'dbo.[ProductSale]') AND name = N'ProductBatchId')
  ALTER TABLE dbo.[ProductSale] ADD [ProductBatchId] INT NULL;
  INSERT INTO [SchemaMigration] ([MigrationName], [Batch]) VALUES (N'2021_03_11_132603_add_product_batch_id_to_product_sales_table', 112);
END
GO

-- MIGRATION: 2021_03_25_125421_add_is_batch_to_products_table
IF NOT EXISTS (SELECT 1 FROM [SchemaMigration] WHERE [MigrationName] = N'2021_03_25_125421_add_is_batch_to_products_table')
BEGIN
  IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'dbo.[Product]') AND name = N'IsBatch')
  ALTER TABLE dbo.[Product] ADD [IsBatch] BIT NULL;
  INSERT INTO [SchemaMigration] ([MigrationName], [Batch]) VALUES (N'2021_03_25_125421_add_is_batch_to_products_table', 113);
END
GO

-- MIGRATION: 2021_05_19_120127_add_product_batch_id_to_product_returns_table
IF NOT EXISTS (SELECT 1 FROM [SchemaMigration] WHERE [MigrationName] = N'2021_05_19_120127_add_product_batch_id_to_product_returns_table')
BEGIN
  IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'dbo.[ProductReturn]') AND name = N'ProductBatchId')
  ALTER TABLE dbo.[ProductReturn] ADD [ProductBatchId] INT NULL;
  INSERT INTO [SchemaMigration] ([MigrationName], [Batch]) VALUES (N'2021_05_19_120127_add_product_batch_id_to_product_returns_table', 114);
END
GO

-- MIGRATION: 2021_05_22_105611_add_product_batch_id_to_purchase_product_return_table
IF NOT EXISTS (SELECT 1 FROM [SchemaMigration] WHERE [MigrationName] = N'2021_05_22_105611_add_product_batch_id_to_purchase_product_return_table')
BEGIN
  IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'dbo.[PurchaseProductReturn]') AND name = N'ProductBatchId')
  ALTER TABLE dbo.[PurchaseProductReturn] ADD [ProductBatchId] INT NULL;
  INSERT INTO [SchemaMigration] ([MigrationName], [Batch]) VALUES (N'2021_05_22_105611_add_product_batch_id_to_purchase_product_return_table', 115);
END
GO

-- MIGRATION: 2021_05_23_124848_add_product_batch_id_to_product_transfer_table
IF NOT EXISTS (SELECT 1 FROM [SchemaMigration] WHERE [MigrationName] = N'2021_05_23_124848_add_product_batch_id_to_product_transfer_table')
BEGIN
  IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'dbo.[ProductTransfer]') AND name = N'ProductBatchId')
  ALTER TABLE dbo.[ProductTransfer] ADD [ProductBatchId] INT NULL;
  INSERT INTO [SchemaMigration] ([MigrationName], [Batch]) VALUES (N'2021_05_23_124848_add_product_batch_id_to_product_transfer_table', 116);
END
GO

-- MIGRATION: 2021_05_26_153106_add_product_batch_id_to_product_quotation_table
IF NOT EXISTS (SELECT 1 FROM [SchemaMigration] WHERE [MigrationName] = N'2021_05_26_153106_add_product_batch_id_to_product_quotation_table')
BEGIN
  IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'dbo.[ProductQuotation]') AND name = N'ProductBatchId')
  ALTER TABLE dbo.[ProductQuotation] ADD [ProductBatchId] INT NULL;
  INSERT INTO [SchemaMigration] ([MigrationName], [Batch]) VALUES (N'2021_05_26_153106_add_product_batch_id_to_product_quotation_table', 117);
END
GO

-- MIGRATION: 2021_06_08_213007_create_reward_point_settings_table
IF NOT EXISTS (SELECT 1 FROM [SchemaMigration] WHERE [MigrationName] = N'2021_06_08_213007_create_reward_point_settings_table')
BEGIN
  IF OBJECT_ID(N'dbo.[RewardPointSetting]', N'U') IS NULL
  BEGIN
  CREATE TABLE dbo.[RewardPointSetting] (
    [Id] BIGINT IDENTITY(1,1) NOT NULL,
    [PerPointAmount] FLOAT NOT NULL,
    [MinimumAmount] FLOAT NOT NULL,
    [Duration] INT NULL,
    [Type] NVARCHAR(191) NULL,
    [IsActive] BIT NOT NULL,
    [CreatedDate] DATETIME2 NULL,
    [ModifiedDate] DATETIME2 NULL
  );
  ALTER TABLE dbo.[RewardPointSetting] ADD CONSTRAINT PK_RewardPointSetting PRIMARY KEY ([Id]);
  IF NOT EXISTS (SELECT 1 FROM sys.default_constraints WHERE name = N'DF_RewardPointSetting_CreatedDate')
    ALTER TABLE dbo.[RewardPointSetting] ADD CONSTRAINT DF_RewardPointSetting_CreatedDate DEFAULT GETDATE() FOR [CreatedDate];
  IF NOT EXISTS (SELECT 1 FROM sys.default_constraints WHERE name = N'DF_RewardPointSetting_ModifiedDate')
    ALTER TABLE dbo.[RewardPointSetting] ADD CONSTRAINT DF_RewardPointSetting_ModifiedDate DEFAULT GETDATE() FOR [ModifiedDate];
  END
  INSERT INTO [SchemaMigration] ([MigrationName], [Batch]) VALUES (N'2021_06_08_213007_create_reward_point_settings_table', 118);
END
GO

-- MIGRATION: 2021_06_16_104155_add_points_to_customers_table
IF NOT EXISTS (SELECT 1 FROM [SchemaMigration] WHERE [MigrationName] = N'2021_06_16_104155_add_points_to_customers_table')
BEGIN
  IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'dbo.[Customer]') AND name = N'Points')
  ALTER TABLE dbo.[Customer] ADD [Points] FLOAT NULL;
  INSERT INTO [SchemaMigration] ([MigrationName], [Batch]) VALUES (N'2021_06_16_104155_add_points_to_customers_table', 119);
END
GO

-- MIGRATION: 2021_06_17_101057_add_used_points_to_payments_table
IF NOT EXISTS (SELECT 1 FROM [SchemaMigration] WHERE [MigrationName] = N'2021_06_17_101057_add_used_points_to_payments_table')
BEGIN
  IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'dbo.[Payment]') AND name = N'UsedPoints')
  ALTER TABLE dbo.[Payment] ADD [UsedPoints] FLOAT NULL;
  INSERT INTO [SchemaMigration] ([MigrationName], [Batch]) VALUES (N'2021_06_17_101057_add_used_points_to_payments_table', 120);
END
GO

-- MIGRATION: 2021_07_06_132716_add_variant_list_to_products_table
IF NOT EXISTS (SELECT 1 FROM [SchemaMigration] WHERE [MigrationName] = N'2021_07_06_132716_add_variant_list_to_products_table')
BEGIN
  IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'dbo.[Product]') AND name = N'VariantList')
  ALTER TABLE dbo.[Product] ADD [VariantList] NVARCHAR(191) NULL;
  INSERT INTO [SchemaMigration] ([MigrationName], [Batch]) VALUES (N'2021_07_06_132716_add_variant_list_to_products_table', 121);
END
GO

-- MIGRATION: 2021_09_27_161141_add_is_imei_to_products_table
IF NOT EXISTS (SELECT 1 FROM [SchemaMigration] WHERE [MigrationName] = N'2021_09_27_161141_add_is_imei_to_products_table')
BEGIN
  IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'dbo.[Product]') AND name = N'IsImei')
  ALTER TABLE dbo.[Product] ADD [IsImei] BIT NULL;
  INSERT INTO [SchemaMigration] ([MigrationName], [Batch]) VALUES (N'2021_09_27_161141_add_is_imei_to_products_table', 122);
END
GO

-- MIGRATION: 2021_09_28_170052_add_imei_number_to_product_warehouse_table
IF NOT EXISTS (SELECT 1 FROM [SchemaMigration] WHERE [MigrationName] = N'2021_09_28_170052_add_imei_number_to_product_warehouse_table')
BEGIN
  IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'dbo.[ProductWarehouse]') AND name = N'ImeiNumber')
  ALTER TABLE dbo.[ProductWarehouse] ADD [ImeiNumber] NVARCHAR(MAX) NULL;
  INSERT INTO [SchemaMigration] ([MigrationName], [Batch]) VALUES (N'2021_09_28_170052_add_imei_number_to_product_warehouse_table', 123);
END
GO

-- MIGRATION: 2021_09_28_170126_add_imei_number_to_product_purchases_table
IF NOT EXISTS (SELECT 1 FROM [SchemaMigration] WHERE [MigrationName] = N'2021_09_28_170126_add_imei_number_to_product_purchases_table')
BEGIN
  IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'dbo.[ProductPurchase]') AND name = N'ImeiNumber')
  ALTER TABLE dbo.[ProductPurchase] ADD [ImeiNumber] NVARCHAR(MAX) NULL;
  INSERT INTO [SchemaMigration] ([MigrationName], [Batch]) VALUES (N'2021_09_28_170126_add_imei_number_to_product_purchases_table', 124);
END
GO

-- MIGRATION: 2021_10_03_170652_add_imei_number_to_product_sales_table
IF NOT EXISTS (SELECT 1 FROM [SchemaMigration] WHERE [MigrationName] = N'2021_10_03_170652_add_imei_number_to_product_sales_table')
BEGIN
  IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'dbo.[ProductSale]') AND name = N'ImeiNumber')
  ALTER TABLE dbo.[ProductSale] ADD [ImeiNumber] NVARCHAR(MAX) NULL;
  INSERT INTO [SchemaMigration] ([MigrationName], [Batch]) VALUES (N'2021_10_03_170652_add_imei_number_to_product_sales_table', 125);
END
GO

-- MIGRATION: 2021_10_10_145214_add_imei_number_to_product_returns_table
IF NOT EXISTS (SELECT 1 FROM [SchemaMigration] WHERE [MigrationName] = N'2021_10_10_145214_add_imei_number_to_product_returns_table')
BEGIN
  IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'dbo.[ProductReturn]') AND name = N'ImeiNumber')
  ALTER TABLE dbo.[ProductReturn] ADD [ImeiNumber] NVARCHAR(MAX) NULL;
  INSERT INTO [SchemaMigration] ([MigrationName], [Batch]) VALUES (N'2021_10_10_145214_add_imei_number_to_product_returns_table', 126);
END
GO

-- MIGRATION: 2021_10_11_104504_add_imei_number_to_product_transfer_table
IF NOT EXISTS (SELECT 1 FROM [SchemaMigration] WHERE [MigrationName] = N'2021_10_11_104504_add_imei_number_to_product_transfer_table')
BEGIN
  IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'dbo.[ProductTransfer]') AND name = N'ImeiNumber')
  ALTER TABLE dbo.[ProductTransfer] ADD [ImeiNumber] NVARCHAR(MAX) NULL;
  INSERT INTO [SchemaMigration] ([MigrationName], [Batch]) VALUES (N'2021_10_11_104504_add_imei_number_to_product_transfer_table', 127);
END
GO

-- MIGRATION: 2021_10_12_160107_add_imei_number_to_purchase_product_return_table
IF NOT EXISTS (SELECT 1 FROM [SchemaMigration] WHERE [MigrationName] = N'2021_10_12_160107_add_imei_number_to_purchase_product_return_table')
BEGIN
  IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'dbo.[PurchaseProductReturn]') AND name = N'ImeiNumber')
  ALTER TABLE dbo.[PurchaseProductReturn] ADD [ImeiNumber] NVARCHAR(MAX) NULL;
  INSERT INTO [SchemaMigration] ([MigrationName], [Batch]) VALUES (N'2021_10_12_160107_add_imei_number_to_purchase_product_return_table', 128);
END
GO

-- MIGRATION: 2021_10_12_205146_add_is_rtl_to_general_settings_table
IF NOT EXISTS (SELECT 1 FROM [SchemaMigration] WHERE [MigrationName] = N'2021_10_12_205146_add_is_rtl_to_general_settings_table')
BEGIN
  IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'dbo.[GeneralSetting]') AND name = N'IsRtl')
  ALTER TABLE dbo.[GeneralSetting] ADD [IsRtl] BIT NULL;
  INSERT INTO [SchemaMigration] ([MigrationName], [Batch]) VALUES (N'2021_10_12_205146_add_is_rtl_to_general_settings_table', 129);
END
GO

-- MIGRATION: 2021_10_23_142451_add_is_approve_to_payments_table
IF NOT EXISTS (SELECT 1 FROM [SchemaMigration] WHERE [MigrationName] = N'2021_10_23_142451_add_is_approve_to_payments_table')
BEGIN
  -- no schema changes
  INSERT INTO [SchemaMigration] ([MigrationName], [Batch]) VALUES (N'2021_10_23_142451_add_is_approve_to_payments_table', 130);
END
GO
