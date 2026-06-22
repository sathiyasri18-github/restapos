using CustomerApi.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CustomerApi.Infrastructure.Persistence.Configurations;

public class PaymentConfiguration : IEntityTypeConfiguration<Payment>
{
    public void Configure(EntityTypeBuilder<Payment> builder)
    {
        builder.ToTable("Payment");
        builder.HasKey(x => x.Id).HasName("PK_Payment");
        builder.Property(x => x.Id).UseIdentityColumn();
        builder.Property(x => x.PaymentReference).HasMaxLength(191);
        builder.Property(x => x.PaymentReference).IsRequired();
        builder.Property(x => x.PayingMethod).HasMaxLength(191);
        builder.Property(x => x.PayingMethod).IsRequired();
        builder.Property(x => x.PaymentNote).IsRequired(false);
        builder.Property(x => x.CreatedDate).HasDefaultValueSql("GETDATE()");
        builder.Property(x => x.CreatedDate).HasAnnotation("Relational:DefaultConstraintName", "DF_Payment_CreatedDate");
        builder.Property(x => x.ModifiedDate).HasDefaultValueSql("GETDATE()");
        builder.Property(x => x.ModifiedDate).HasAnnotation("Relational:DefaultConstraintName", "DF_Payment_ModifiedDate");
    }
}
