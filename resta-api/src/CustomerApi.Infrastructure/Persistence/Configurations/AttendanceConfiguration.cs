using CustomerApi.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CustomerApi.Infrastructure.Persistence.Configurations;

public class AttendanceConfiguration : IEntityTypeConfiguration<Attendance>
{
    public void Configure(EntityTypeBuilder<Attendance> builder)
    {
        builder.ToTable("Attendance");
        builder.HasKey(x => x.Id).HasName("PK_Attendance");
        builder.Property(x => x.Id).UseIdentityColumn();
        builder.Property(x => x.Date).HasColumnType("date");
        builder.Property(x => x.Checkin).HasMaxLength(191);
        builder.Property(x => x.Checkin).IsRequired();
        builder.Property(x => x.Checkout).HasMaxLength(191);
        builder.Property(x => x.Checkout).IsRequired();
        builder.Property(x => x.Note).IsRequired(false);
        builder.Property(x => x.CreatedDate).HasDefaultValueSql("GETDATE()");
        builder.Property(x => x.CreatedDate).HasAnnotation("Relational:DefaultConstraintName", "DF_Attendance_CreatedDate");
        builder.Property(x => x.ModifiedDate).HasDefaultValueSql("GETDATE()");
        builder.Property(x => x.ModifiedDate).HasAnnotation("Relational:DefaultConstraintName", "DF_Attendance_ModifiedDate");
    }
}
