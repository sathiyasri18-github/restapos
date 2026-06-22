using CustomerApi.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CustomerApi.Infrastructure.Persistence.Configurations;

public class ProductBatchConfiguration : IEntityTypeConfiguration<ProductBatch>
{
    public void Configure(EntityTypeBuilder<ProductBatch> builder)
    {
        builder.ToTable("ProductBatch");
        builder.HasKey(x => x.Id).HasName("PK_ProductBatch");
        builder.Property(x => x.Id).UseIdentityColumn();
        builder.Property(x => x.BatchNo).HasMaxLength(191);
        builder.Property(x => x.BatchNo).IsRequired();
        builder.Property(x => x.ExpiredDate).HasColumnType("date");
        builder.Property(x => x.CreatedDate).HasDefaultValueSql("GETDATE()");
        builder.Property(x => x.CreatedDate).HasAnnotation("Relational:DefaultConstraintName", "DF_ProductBatch_CreatedDate");
        builder.Property(x => x.ModifiedDate).HasDefaultValueSql("GETDATE()");
        builder.Property(x => x.ModifiedDate).HasAnnotation("Relational:DefaultConstraintName", "DF_ProductBatch_ModifiedDate");
    }
}
