using CustomerApi.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CustomerApi.Infrastructure.Persistence.Configurations;

public class DeliveryConfiguration : IEntityTypeConfiguration<Delivery>
{
    public void Configure(EntityTypeBuilder<Delivery> builder)
    {
        builder.ToTable("Delivery");
        builder.HasKey(x => x.Id).HasName("PK_Delivery");
        builder.Property(x => x.Id).UseIdentityColumn();
        builder.Property(x => x.ReferenceNo).HasMaxLength(191);
        builder.Property(x => x.ReferenceNo).IsRequired();
        builder.Property(x => x.Address).IsRequired();
        builder.Property(x => x.DeliveredBy).HasMaxLength(191);
        builder.Property(x => x.DeliveredBy).IsRequired(false);
        builder.Property(x => x.RecievedBy).HasMaxLength(191);
        builder.Property(x => x.RecievedBy).IsRequired(false);
        builder.Property(x => x.File).HasMaxLength(191);
        builder.Property(x => x.File).IsRequired(false);
        builder.Property(x => x.Note).HasMaxLength(191);
        builder.Property(x => x.Note).IsRequired(false);
        builder.Property(x => x.Status).HasMaxLength(191);
        builder.Property(x => x.Status).IsRequired();
        builder.Property(x => x.CreatedDate).HasDefaultValueSql("GETDATE()");
        builder.Property(x => x.CreatedDate).HasAnnotation("Relational:DefaultConstraintName", "DF_Delivery_CreatedDate");
        builder.Property(x => x.ModifiedDate).HasDefaultValueSql("GETDATE()");
        builder.Property(x => x.ModifiedDate).HasAnnotation("Relational:DefaultConstraintName", "DF_Delivery_ModifiedDate");
    }
}
