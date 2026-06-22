using CustomerApi.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CustomerApi.Infrastructure.Persistence.Configurations;

public class SaleReturnConfiguration : IEntityTypeConfiguration<SaleReturn>
{
    public void Configure(EntityTypeBuilder<SaleReturn> builder)
    {
        builder.ToTable("SaleReturn");
        builder.HasKey(x => x.Id).HasName("PK_SaleReturn");
        builder.Property(x => x.Id).UseIdentityColumn();
        builder.Property(x => x.ReferenceNo).HasMaxLength(191);
        builder.Property(x => x.ReferenceNo).IsRequired();
        builder.Property(x => x.Document).HasMaxLength(191);
        builder.Property(x => x.Document).IsRequired(false);
        builder.Property(x => x.ReturnNote).IsRequired(false);
        builder.Property(x => x.StaffNote).IsRequired(false);
        builder.Property(x => x.CreatedDate).HasDefaultValueSql("GETDATE()");
        builder.Property(x => x.CreatedDate).HasAnnotation("Relational:DefaultConstraintName", "DF_SaleReturn_CreatedDate");
        builder.Property(x => x.ModifiedDate).HasDefaultValueSql("GETDATE()");
        builder.Property(x => x.ModifiedDate).HasAnnotation("Relational:DefaultConstraintName", "DF_SaleReturn_ModifiedDate");
    }
}
