using CustomerApi.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CustomerApi.Infrastructure.Persistence.Configurations;

public class SupplierConfiguration : IEntityTypeConfiguration<Supplier>
{
    public void Configure(EntityTypeBuilder<Supplier> builder)
    {
        builder.ToTable("Supplier");
        builder.HasKey(x => x.Id).HasName("PK_Supplier");
        builder.Property(x => x.Id).UseIdentityColumn();
        builder.Property(x => x.Name).HasMaxLength(191);
        builder.Property(x => x.Name).IsRequired();
        builder.Property(x => x.Image).HasMaxLength(191);
        builder.Property(x => x.Image).IsRequired(false);
        builder.Property(x => x.CompanyName).HasMaxLength(191);
        builder.Property(x => x.CompanyName).IsRequired();
        builder.Property(x => x.VatNumber).HasMaxLength(191);
        builder.Property(x => x.VatNumber).IsRequired(false);
        builder.Property(x => x.Email).HasMaxLength(191);
        builder.Property(x => x.Email).IsRequired();
        builder.Property(x => x.PhoneNumber).HasMaxLength(191);
        builder.Property(x => x.PhoneNumber).IsRequired();
        builder.Property(x => x.Address).HasMaxLength(191);
        builder.Property(x => x.Address).IsRequired();
        builder.Property(x => x.City).HasMaxLength(191);
        builder.Property(x => x.City).IsRequired();
        builder.Property(x => x.State).HasMaxLength(191);
        builder.Property(x => x.State).IsRequired(false);
        builder.Property(x => x.PostalCode).HasMaxLength(191);
        builder.Property(x => x.PostalCode).IsRequired(false);
        builder.Property(x => x.Country).HasMaxLength(191);
        builder.Property(x => x.Country).IsRequired(false);
        builder.Property(x => x.CreatedDate).HasDefaultValueSql("GETDATE()");
        builder.Property(x => x.CreatedDate).HasAnnotation("Relational:DefaultConstraintName", "DF_Supplier_CreatedDate");
        builder.Property(x => x.ModifiedDate).HasDefaultValueSql("GETDATE()");
        builder.Property(x => x.ModifiedDate).HasAnnotation("Relational:DefaultConstraintName", "DF_Supplier_ModifiedDate");
    }
}
