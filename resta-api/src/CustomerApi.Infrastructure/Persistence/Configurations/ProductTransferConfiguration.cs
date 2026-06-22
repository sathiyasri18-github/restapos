using CustomerApi.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CustomerApi.Infrastructure.Persistence.Configurations;

public class ProductTransferConfiguration : IEntityTypeConfiguration<ProductTransfer>
{
    public void Configure(EntityTypeBuilder<ProductTransfer> builder)
    {
        builder.ToTable("ProductTransfer");
        builder.HasKey(x => x.Id).HasName("PK_ProductTransfer");
        builder.Property(x => x.Id).UseIdentityColumn();
        builder.Property(x => x.ImeiNumber).IsRequired(false);
        builder.Property(x => x.CreatedDate).HasDefaultValueSql("GETDATE()");
        builder.Property(x => x.CreatedDate).HasAnnotation("Relational:DefaultConstraintName", "DF_ProductTransfer_CreatedDate");
        builder.Property(x => x.ModifiedDate).HasDefaultValueSql("GETDATE()");
        builder.Property(x => x.ModifiedDate).HasAnnotation("Relational:DefaultConstraintName", "DF_ProductTransfer_ModifiedDate");
    }
}
