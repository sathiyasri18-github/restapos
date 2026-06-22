CREATE OR ALTER PROCEDURE usp_GetServiceCallDashboard
(
    @FromDate DATE = NULL,
    @ToDate   DATE = NULL
)
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
    (
        SELECT
        (
            SELECT
                C.CategoryName AS Label,
                COUNT(*) AS Count
            FROM ServiceCalls SC
            INNER JOIN Category C ON C.CategoryId = SC.ServiceTypeId
            WHERE
                (@FromDate IS NULL OR CAST(SC.ServiceDate AS DATE) >= @FromDate)
                AND (@ToDate IS NULL OR CAST(SC.ServiceDate AS DATE) <= @ToDate)
            GROUP BY C.CategoryName
            FOR JSON PATH
        ) AS serviceType,

        (
            SELECT
                C.CategoryName AS Label,
                COUNT(*) AS Count
            FROM ServiceCalls SC
            INNER JOIN Category C ON C.CategoryId = SC.StatusId
            WHERE
                (@FromDate IS NULL OR CAST(SC.ServiceDate AS DATE) >= @FromDate)
                AND (@ToDate IS NULL OR CAST(SC.ServiceDate AS DATE) <= @ToDate)
            GROUP BY C.CategoryName
            FOR JSON PATH
        ) AS status,

        (
            SELECT
                C.CategoryName AS Label,
                COUNT(*) AS Count
            FROM ServiceCalls SC
            INNER JOIN Category C ON C.CategoryId = SC.PriorityId
            WHERE
                (@FromDate IS NULL OR CAST(SC.ServiceDate AS DATE) >= @FromDate)
                AND (@ToDate IS NULL OR CAST(SC.ServiceDate AS DATE) <= @ToDate)
            GROUP BY C.CategoryName
            FOR JSON PATH
        ) AS priority,

        (
            SELECT
                C.CategoryName AS Label,
                COUNT(*) AS Count
            FROM ServiceCalls SC
            INNER JOIN Category C ON C.CategoryId = SC.ActionTakenId
            WHERE
                (@FromDate IS NULL OR CAST(SC.ServiceDate AS DATE) >= @FromDate)
                AND (@ToDate IS NULL OR CAST(SC.ServiceDate AS DATE) <= @ToDate)
            GROUP BY C.CategoryName
            FOR JSON PATH
        ) AS actionTaken,

        (
            SELECT
                E.EmployeeName AS Label,
                COUNT(*) AS Count
            FROM ServiceCalls SC
            INNER JOIN Employee E ON E.EmployeeId = SC.AssignedEngineerId
            WHERE
                (@FromDate IS NULL OR CAST(SC.ServiceDate AS DATE) >= @FromDate)
                AND (@ToDate IS NULL OR CAST(SC.ServiceDate AS DATE) <= @ToDate)
            GROUP BY E.EmployeeName
            FOR JSON PATH
        ) AS assignedEngineer
        FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
    ) AS Result;

    SELECT
        SC.ServiceCallId,
        SC.CustomerId,
        SC.ServiceTypeId,
        SC.ProblemReport,
        SC.ActionTakenId,
        SC.AssignedEngineerId,
        SC.ChiefEngineerId,
        SC.ServiceDate,
        SC.DueDate,
        SC.CompletedDate,
        SC.StatusId,
        SC.PriorityId,
        SC.Remarks,
        SC.CreatedDate,
        SC.CreatedBy,
        SC.ModifiedDate,
        SC.ModifiedBy
    FROM ServiceCalls SC
    WHERE
        (@FromDate IS NULL OR CAST(SC.ServiceDate AS DATE) >= @FromDate)
        AND (@ToDate IS NULL OR CAST(SC.ServiceDate AS DATE) <= @ToDate);
END
GO
