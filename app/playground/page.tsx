"use client"

import { useState, useMemo } from "react"
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getGroupedRowModel,
  getExpandedRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  flexRender,
  createColumnHelper,
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
  type VisibilityState,
  type ExpandedState,
  type GroupingState,
} from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { 
  ChevronDown, 
  ChevronRight, 
  Download, 
  Upload, 
  Filter,
  Settings,
  Eye,
  EyeOff
} from "lucide-react"

// Sample data structure
type Person = {
  id: string
  firstName: string
  lastName: string
  age: number
  visits: number
  status: string
  progress: number
  email: string
  department: string
  salary: number
  startDate: string
}

// Sample data
const defaultData: Person[] = [
  {
    id: "1",
    firstName: "John",
    lastName: "Doe",
    age: 30,
    visits: 10,
    status: "Active",
    progress: 75,
    email: "john.doe@example.com",
    department: "Engineering",
    salary: 75000,
    startDate: "2023-01-15",
  },
  {
    id: "2",
    firstName: "Jane",
    lastName: "Smith",
    age: 28,
    visits: 15,
    status: "Active",
    progress: 90,
    email: "jane.smith@example.com",
    department: "Marketing",
    salary: 65000,
    startDate: "2023-03-20",
  },
  {
    id: "3",
    firstName: "Bob",
    lastName: "Johnson",
    age: 35,
    visits: 8,
    status: "Inactive",
    progress: 45,
    email: "bob.johnson@example.com",
    department: "Sales",
    salary: 80000,
    startDate: "2022-11-10",
  },
  {
    id: "4",
    firstName: "Alice",
    lastName: "Brown",
    age: 32,
    visits: 12,
    status: "Active",
    progress: 60,
    email: "alice.brown@example.com",
    department: "Engineering",
    salary: 70000,
    startDate: "2023-02-05",
  },
  {
    id: "5",
    firstName: "Charlie",
    lastName: "Wilson",
    age: 29,
    visits: 20,
    status: "Active",
    progress: 85,
    email: "charlie.wilson@example.com",
    department: "Marketing",
    salary: 60000,
    startDate: "2023-04-12",
  },
]

const columnHelper = createColumnHelper<Person>()

const columns = [
  columnHelper.accessor("firstName", {
    header: "First Name",
    cell: (info) => info.getValue(),
  }),
  columnHelper.accessor("lastName", {
    header: "Last Name",
    cell: (info) => info.getValue(),
  }),
  columnHelper.accessor("age", {
    header: "Age",
    cell: (info) => info.getValue(),
  }),
  columnHelper.accessor("email", {
    header: "Email",
    cell: (info) => info.getValue(),
  }),
  columnHelper.accessor("department", {
    header: "Department",
    cell: (info) => (
      <Badge variant="secondary">{info.getValue()}</Badge>
    ),
  }),
  columnHelper.accessor("status", {
    header: "Status",
    cell: (info) => (
      <Badge 
        variant={info.getValue() === "Active" ? "default" : "destructive"}
      >
        {info.getValue()}
      </Badge>
    ),
  }),
  columnHelper.accessor("progress", {
    header: "Progress",
    cell: (info) => (
      <div className="w-full bg-secondary rounded-full h-2">
        <div
          className="bg-primary h-2 rounded-full"
          style={{ width: `${info.getValue()}%` }}
        />
      </div>
    ),
  }),
  columnHelper.accessor("salary", {
    header: "Salary",
    cell: (info) => `$${info.getValue().toLocaleString()}`,
  }),
  columnHelper.accessor("visits", {
    header: "Visits",
    cell: (info) => info.getValue(),
  }),
]

export default function PlaygroundPage() {
  const [data, setData] = useState<Person[]>(defaultData)
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = useState({})
  const [globalFilter, setGlobalFilter] = useState("")
  const [grouping, setGrouping] = useState<GroupingState>([])
  const [expanded, setExpanded] = useState<ExpandedState>({})
  const [importData, setImportData] = useState("")

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      globalFilter,
      grouping,
      expanded,
    },
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onGlobalFilterChange: setGlobalFilter,
    onGroupingChange: setGrouping,
    onExpandedChange: setExpanded,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getGroupedRowModel: getGroupedRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  })

  const handleImport = () => {
    try {
      const parsedData = JSON.parse(importData)
      if (Array.isArray(parsedData)) {
        setData(parsedData)
        setImportData("")
      }
    } catch (error) {
      console.error("Invalid JSON data:", error)
    }
  }

  const handleExport = () => {
    const jsonString = JSON.stringify(data, null, 2)
    const blob = new Blob([jsonString], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "table-data.json"
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">TanStack Table Playground</h2>
          <p className="text-muted-foreground">
            Interactive table with import/export capabilities
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={handleExport} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Import Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Import Data
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder="Paste JSON data here..."
            value={importData}
            onChange={(e) => setImportData(e.target.value)}
            rows={4}
          />
          <div className="flex items-center gap-2">
            <Button onClick={handleImport} disabled={!importData.trim()}>
              Import JSON
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setData(defaultData)}
            >
              Reset to Sample Data
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            Data Table ({table.getFilteredRowModel().rows.length} rows)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Table Controls */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Input
                placeholder="Search all columns..."
                value={globalFilter ?? ""}
                onChange={(event: React.ChangeEvent<HTMLInputElement>) => setGlobalFilter(event.target.value)}
                className="max-w-sm"
              />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="ml-auto">
                  <Eye className="h-4 w-4 mr-2" />
                  Columns
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {table
                  .getAllColumns()
                  .filter((column) => column.getCanHide())
                  .map((column) => {
                    return (
                      <DropdownMenuCheckboxItem
                        key={column.id}
                        className="capitalize"
                        checked={column.getIsVisible()}
                        onCheckedChange={(value) =>
                          column.toggleVisibility(!!value)
                        }
                      >
                        {column.id}
                      </DropdownMenuCheckboxItem>
                    )
                  })}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => {
                      return (
                        <TableHead key={header.id}>
                          {header.isPlaceholder
                            ? null
                            : flexRender(
                                header.column.columnDef.header,
                                header.getContext()
                              )}
                        </TableHead>
                      )
                    })}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows?.length ? (
                  table.getRowModel().rows.map((row) => (
                    <TableRow
                      key={row.id}
                      data-state={row.getIsSelected() && "selected"}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={columns.length}
                      className="h-24 text-center"
                    >
                      No results.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-end space-x-2 py-4">
            <div className="flex-1 text-sm text-muted-foreground">
              {table.getFilteredSelectedRowModel().rows.length} of{" "}
              {table.getFilteredRowModel().rows.length} row(s) selected.
            </div>
            <div className="space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
