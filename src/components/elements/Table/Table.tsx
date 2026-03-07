"use client";

import { MaterialReactTable } from "material-react-table";
import { MRT_Localization_ES } from "material-react-table/locales/es";
import { useMemo } from "react";
import { useTheme } from "next-themes";

interface ITableProps {
  columns: any[];
  data: any[];
  isLoading: boolean;
}

const Table = ({ columns, data, isLoading }: ITableProps) => {
  const { theme } = useTheme();

  const tableTheme = useMemo(() => {
    const isDark = theme === "dark";
    return {
      baseBackgroundColor: isDark ? "#2a2a2a" : "#ffffff",
      paperBackgroundColor: isDark ? "#2a2a2a" : "#ffffff",
      headerBackgroundColor: isDark ? "#333333" : "#f9fafb",
      rowBackgroundColor: isDark ? "#2a2a2a" : "#ffffff",
      rowHoverColor: isDark ? "#3a3a3a" : "#f3f4f6",
      borderColor: isDark ? "#404040" : "#e5e7eb",
      textColor: isDark ? "#e5e5e5" : "#111827",
      textSecondary: isDark ? "#a0a0a0" : "#6b7280",
      inputBackground: isDark ? "#1f1f1f" : "#ffffff",
    };
  }, [theme]);

  return (
    <div className="w-full">
      <MaterialReactTable
        data={data}
        columns={columns}
        localization={MRT_Localization_ES}
        state={{ isLoading }}
        enableColumnResizing
        enableColumnOrdering
        enableStickyHeader
        muiTablePaperProps={{
          elevation: 0,
          sx: {
            backgroundColor: tableTheme.paperBackgroundColor,
            borderRadius: "8px",
            border: `1px solid ${tableTheme.borderColor}`,
            overflow: "hidden",
            boxShadow: "none",
          },
        }}
        muiTableContainerProps={{
          sx: {
            maxHeight: "calc(100vh - 280px)",
            backgroundColor: tableTheme.baseBackgroundColor,
          },
        }}
        muiTableHeadCellProps={{
          sx: {
            backgroundColor: tableTheme.headerBackgroundColor,
            color: tableTheme.textColor,
            fontWeight: 600,
            fontSize: "0.875rem",
            borderBottom: `1px solid ${tableTheme.borderColor}`,
            padding: "12px 16px",
            "& .Mui-TableHeadCell-Content": {
              color: tableTheme.textColor,
              fontWeight: 600,
            },
            "& .MuiSvgIcon-root": {
              color: tableTheme.textSecondary,
            },
            "& .MuiButtonBase-root": {
              color: tableTheme.textColor,
            },
          },
        }}
        muiTableBodyCellProps={{
          sx: {
            backgroundColor: tableTheme.rowBackgroundColor,
            color: tableTheme.textColor,
            borderBottom: `1px solid ${tableTheme.borderColor}`,
            fontSize: "0.875rem",
            padding: "12px 16px",
          },
        }}
        muiTableBodyRowProps={({ row }) => ({
          sx: {
            backgroundColor: tableTheme.rowBackgroundColor,
            "&:hover": {
              backgroundColor: tableTheme.rowHoverColor,
            },
            "&:hover td": {
              backgroundColor: tableTheme.rowHoverColor,
            },
          },
        })}
        muiTopToolbarProps={{
          sx: {
            backgroundColor: tableTheme.baseBackgroundColor,
            borderBottom: `1px solid ${tableTheme.borderColor}`,
            padding: "12px 16px",
            minHeight: "64px",
            "& .MuiIconButton-root": {
              color: tableTheme.textSecondary,
              "&:hover": {
                backgroundColor: tableTheme.rowHoverColor,
              },
            },
            "& .MuiInputBase-root": {
              color: tableTheme.textColor,
              backgroundColor: tableTheme.inputBackground,
              fontSize: "0.875rem",
            },
            "& .MuiBox-root": {
              gap: "8px",
            },
          },
        }}
        muiBottomToolbarProps={{
          sx: {
            backgroundColor: tableTheme.baseBackgroundColor,
            borderTop: `1px solid ${tableTheme.borderColor}`,
            "& .MuiInputLabel-root": {
              color: tableTheme.textSecondary,
            },
            "& .MuiTablePagination-root": {
              color: tableTheme.textColor,
            },
            "& .MuiTablePagination-selectLabel": {
              color: tableTheme.textColor,
            },
            "& .MuiTablePagination-displayedRows": {
              color: tableTheme.textColor,
            },
            "& .MuiTablePagination-form": {
              color: tableTheme.textColor,
            },
            "& .MuiIconButton-root": {
              color: tableTheme.textSecondary,
              "&:hover": {
                backgroundColor: tableTheme.rowHoverColor,
              },
            },
            "& .MuiSelect-select": {
              color: tableTheme.textColor,
            },
            "& .MuiInputBase-root": {
              color: tableTheme.textColor,
            },
          },
        }}
        muiTableBodyProps={{
          sx: {
            "& .MuiTableCell-root": {
              color: tableTheme.textColor,
            },
          },
        }}
        muiLinearProgressProps={{
          sx: {
            backgroundColor: tableTheme.rowHoverColor,
            "& .MuiLinearProgress-bar": {
              backgroundColor: "#3b82f6",
            },
          },
        }}
        renderEmptyRowsFallback={() => (
          <div style={{ 
            padding: "40px 20px", 
            textAlign: "center", 
            color: tableTheme.textSecondary,
            fontSize: "0.875rem"
          }}>
            No hay registros para mostrar
          </div>
        )}
        muiSearchTextFieldProps={{
          placeholder: "Buscar...",
          sx: {
            minWidth: "250px",
            "& .MuiOutlinedInput-root": {
              color: tableTheme.textColor,
              backgroundColor: tableTheme.inputBackground,
              fontSize: "0.875rem",
              "& fieldset": {
                borderColor: tableTheme.borderColor,
              },
              "&:hover fieldset": {
                borderColor: tableTheme.textSecondary,
              },
              "&.Mui-focused fieldset": {
                borderColor: "#3b82f6",
              },
              "& input": {
                padding: "10px 14px",
                color: tableTheme.textColor,
              },
              "& input::placeholder": {
                color: tableTheme.textSecondary,
                opacity: 0.7,
              },
            },
            "& .MuiInputLabel-root": {
              color: tableTheme.textSecondary,
            },
          },
          variant: "outlined",
          size: "small",
        }}
        muiTableProps={{
          sx: {
            backgroundColor: tableTheme.baseBackgroundColor,
            tableLayout: "auto",
          },
        }}
        layoutMode="grid"
      />
    </div>
  );
};

export default Table;
