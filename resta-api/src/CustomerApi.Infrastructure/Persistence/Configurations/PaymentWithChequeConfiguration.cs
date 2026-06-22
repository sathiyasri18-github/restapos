using CustomerApi.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CustomerApi.Infrastructure.Persistence.Configurations;

public class PaymentWithChequeConfiguration : IEntityTypeConfiguration<PaymentWithCheque>
{
    public void Configure(EntityTypeBuilder<PaymentWithCheque> builder)
    {
        builder.ToTable("PaymentWithCheque");
        builder.HasKey(x => x.Id).HasName("PK_PaymentWithCheque");
        builder.Property(x => x.Id).UseIdentityColumn();
        builder.Property(x => x.ChequeNo).HasMaxLength(191);
        builder.Property(x => x.ChequeNo).IsRequired();
        builder.Property(x => x.CreatedDate).HasDefaultValueSql("GETDATE()");
        builder.Property(x => x.CreatedDate).HasAnnotation("Relational:DefaultConstraintName", "DF_PaymentWithCheque_CreatedDate");
        builder.Property(x => x.ModifiedDate).HasDefaultValueSql("GETDATE()");
        builder.Property(x => x.ModifiedDate).HasAnnotation("Relational:DefaultConstraintName", "DF_PaymentWithCheque_ModifiedDate");
    }
}
