using CustomerApi.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CustomerApi.Infrastructure.Persistence.Configurations;

public class PaymentWithPaypalConfiguration : IEntityTypeConfiguration<PaymentWithPaypal>
{
    public void Configure(EntityTypeBuilder<PaymentWithPaypal> builder)
    {
        builder.ToTable("PaymentWithPaypal");
        builder.HasKey(x => x.Id).HasName("PK_PaymentWithPaypal");
        builder.Property(x => x.Id).UseIdentityColumn();
        builder.Property(x => x.TransactionId).HasMaxLength(191);
        builder.Property(x => x.TransactionId).IsRequired();
        builder.Property(x => x.CreatedDate).HasDefaultValueSql("GETDATE()");
        builder.Property(x => x.CreatedDate).HasAnnotation("Relational:DefaultConstraintName", "DF_PaymentWithPaypal_CreatedDate");
        builder.Property(x => x.ModifiedDate).HasDefaultValueSql("GETDATE()");
        builder.Property(x => x.ModifiedDate).HasAnnotation("Relational:DefaultConstraintName", "DF_PaymentWithPaypal_ModifiedDate");
    }
}
