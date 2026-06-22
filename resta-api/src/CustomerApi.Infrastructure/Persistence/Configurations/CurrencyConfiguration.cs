using CustomerApi.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CustomerApi.Infrastructure.Persistence.Configurations;

public class CurrencyConfiguration : IEntityTypeConfiguration<Currency>
{
    public void Configure(EntityTypeBuilder<Currency> builder)
    {
        builder.ToTable("Currency");
        builder.HasKey(x => x.Id).HasName("PK_Currency");
        builder.Property(x => x.Id).UseIdentityColumn();
        builder.Property(x => x.Name).HasMaxLength(191);
        builder.Property(x => x.Name).IsRequired();
        builder.Property(x => x.Code).HasMaxLength(191);
        builder.Property(x => x.Code).IsRequired();
        builder.Property(x => x.CreatedDate).HasDefaultValueSql("GETDATE()");
        builder.Property(x => x.CreatedDate).HasAnnotation("Relational:DefaultConstraintName", "DF_Currency_CreatedDate");
        builder.Property(x => x.ModifiedDate).HasDefaultValueSql("GETDATE()");
        builder.Property(x => x.ModifiedDate).HasAnnotation("Relational:DefaultConstraintName", "DF_Currency_ModifiedDate");
    }
}
