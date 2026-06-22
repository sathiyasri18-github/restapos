using CustomerApi.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CustomerApi.Infrastructure.Persistence.Configurations;

public class CustomerConfiguration : IEntityTypeConfiguration<Customer>
{
    public void Configure(EntityTypeBuilder<Customer> builder)
    {
        builder.ToTable("Customer");
        builder.HasKey(x => x.Id).HasName("PK_Customer");
        builder.Property(x => x.Id).UseIdentityColumn();
        builder.Property(x => x.Name).HasMaxLength(191);
        builder.Property(x => x.Name).IsRequired();
        builder.Property(x => x.CompanyName).HasMaxLength(191);
        builder.Property(x => x.CompanyName).IsRequired(false);
        builder.Property(x => x.Email).HasMaxLength(191);
        builder.Property(x => x.Email).IsRequired(false);
        builder.Property(x => x.PhoneNumber).HasMaxLength(191);
        builder.Property(x => x.PhoneNumber).IsRequired();
        builder.Property(x => x.TaxNo).HasMaxLength(191);
        builder.Property(x => x.TaxNo).IsRequired(false);
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
        builder.Property(x => x.CreatedDate).HasAnnotation("Relational:DefaultConstraintName", "DF_Customer_CreatedDate");
        builder.Property(x => x.ModifiedDate).HasDefaultValueSql("GETDATE()");
        builder.Property(x => x.ModifiedDate).HasAnnotation("Relational:DefaultConstraintName", "DF_Customer_ModifiedDate");
    }
}
