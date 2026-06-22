using CustomerApi.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CustomerApi.Infrastructure.Persistence.Configurations;

public class PayrollConfiguration : IEntityTypeConfiguration<Payroll>
{
    public void Configure(EntityTypeBuilder<Payroll> builder)
    {
        builder.ToTable("Payroll");
        builder.HasKey(x => x.Id).HasName("PK_Payroll");
        builder.Property(x => x.Id).UseIdentityColumn();
        builder.Property(x => x.ReferenceNo).HasMaxLength(191);
        builder.Property(x => x.ReferenceNo).IsRequired();
        builder.Property(x => x.PayingMethod).HasMaxLength(191);
        builder.Property(x => x.PayingMethod).IsRequired();
        builder.Property(x => x.Note).IsRequired(false);
        builder.Property(x => x.CreatedDate).HasDefaultValueSql("GETDATE()");
        builder.Property(x => x.CreatedDate).HasAnnotation("Relational:DefaultConstraintName", "DF_Payroll_CreatedDate");
        builder.Property(x => x.ModifiedDate).HasDefaultValueSql("GETDATE()");
        builder.Property(x => x.ModifiedDate).HasAnnotation("Relational:DefaultConstraintName", "DF_Payroll_ModifiedDate");
    }
}
