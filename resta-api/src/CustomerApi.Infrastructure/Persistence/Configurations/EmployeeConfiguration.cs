using CustomerApi.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CustomerApi.Infrastructure.Persistence.Configurations;

public class EmployeeConfiguration : IEntityTypeConfiguration<Employee>
{
    public void Configure(EntityTypeBuilder<Employee> builder)
    {
        builder.ToTable("Employee");
        builder.HasKey(x => x.Id).HasName("PK_Employee");
        builder.Property(x => x.Id).UseIdentityColumn();
        builder.Property(x => x.Name).HasMaxLength(191);
        builder.Property(x => x.Name).IsRequired();
        builder.Property(x => x.Email).HasMaxLength(191);
        builder.Property(x => x.Email).IsRequired();
        builder.Property(x => x.PhoneNumber).HasMaxLength(191);
        builder.Property(x => x.PhoneNumber).IsRequired();
        builder.Property(x => x.Image).HasMaxLength(191);
        builder.Property(x => x.Image).IsRequired(false);
        builder.Property(x => x.Address).HasMaxLength(191);
        builder.Property(x => x.Address).IsRequired(false);
        builder.Property(x => x.City).HasMaxLength(191);
        builder.Property(x => x.City).IsRequired(false);
        builder.Property(x => x.Country).HasMaxLength(191);
        builder.Property(x => x.Country).IsRequired(false);
        builder.Property(x => x.CreatedDate).HasDefaultValueSql("GETDATE()");
        builder.Property(x => x.CreatedDate).HasAnnotation("Relational:DefaultConstraintName", "DF_Employee_CreatedDate");
        builder.Property(x => x.ModifiedDate).HasDefaultValueSql("GETDATE()");
        builder.Property(x => x.ModifiedDate).HasAnnotation("Relational:DefaultConstraintName", "DF_Employee_ModifiedDate");
    }
}
