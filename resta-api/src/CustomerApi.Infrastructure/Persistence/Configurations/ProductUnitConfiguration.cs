using CustomerApi.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CustomerApi.Infrastructure.Persistence.Configurations;

public class ProductUnitConfiguration : IEntityTypeConfiguration<ProductUnit>
{
    public void Configure(EntityTypeBuilder<ProductUnit> builder)
    {
        builder.ToTable("ProductUnit");
        builder.HasKey(x => x.Id).HasName("PK_ProductUnit");
        builder.Property(x => x.Id).UseIdentityColumn();
        builder.Property(x => x.UnitCode).HasMaxLength(191);
        builder.Property(x => x.UnitCode).IsRequired();
        builder.Property(x => x.UnitName).HasMaxLength(191);
        builder.Property(x => x.UnitName).IsRequired();
        builder.Property(x => x.Operator).HasMaxLength(191);
        builder.Property(x => x.Operator).IsRequired(false);
        builder.Property(x => x.CreatedDate).HasDefaultValueSql("GETDATE()");
        builder.Property(x => x.CreatedDate).HasAnnotation("Relational:DefaultConstraintName", "DF_ProductUnit_CreatedDate");
        builder.Property(x => x.ModifiedDate).HasDefaultValueSql("GETDATE()");
        builder.Property(x => x.ModifiedDate).HasAnnotation("Relational:DefaultConstraintName", "DF_ProductUnit_ModifiedDate");
    }
}
