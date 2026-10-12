"use client";

import * as React from "react";
import { ROLES } from "@/lib/roles";
import { RoleDashboardShell } from "@/components/dashboards/role-dashboard-shell";
import { getCrNav } from "@/components/dashboards/nav-config";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SearchIcon, UsersIcon, DoorOpenIcon, ShieldCheckIcon, PhoneIcon, AlertCircleIcon } from "lucide-react";
import { toast } from "sonner";

export default function CrResidentsPage() {
  const role = ROLES.find((r) => r.id === "cr") || ROLES[1];
  const navItems = getCrNav();

  const [search, setSearch] = React.useState("");

  const residents = [
    { id: "1", name: "Aryan Sharma", room: "B-204", roll: "121CS0412", phone: "+91 98765 43210", complaints: 1, status: "Clean", branch: "CSE - 3rd Yr" },
    { id: "2", name: "Vikram Rathore", room: "B-204", roll: "121CS0418", phone: "+91 98765 43211", complaints: 0, status: "Clean", branch: "CSE - 3rd Yr" },
    { id: "3", name: "Rohan Verma", room: "B-205", roll: "121ME0210", phone: "+91 98765 43212", complaints: 0, status: "Inspection Due", branch: "ME - 3rd Yr" },
    { id: "4", name: "Sneha Mukherjee", room: "B-206", roll: "121EE0104", phone: "+91 98765 43213", complaints: 2, status: "Needs Water Fix", branch: "EE - 3rd Yr" },
    { id: "5", name: "Amitav Mohanty", room: "B-207", roll: "121MM0045", phone: "+91 98765 43214", complaints: 0, status: "Clean", branch: "Meta - 3rd Yr" },
    { id: "6", name: "Debashis Swain", room: "B-208", roll: "121EC0319", phone: "+91 98765 43215", complaints: 1, status: "Clean", branch: "ECE - 3rd Yr" },
    { id: "7", name: "Priya Das", room: "B-209", roll: "121CH0112", phone: "+91 98765 43216", complaints: 0, status: "Clean", branch: "Chem - 3rd Yr" },
    { id: "8", name: "Kunal Pradhan", room: "B-210", roll: "121CE0155", phone: "+91 98765 43217", complaints: 0, status: "Clean", branch: "Civil - 3rd Yr" },
  ];

  const filtered = residents.filter(
    (r) =>
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.room.toLowerCase().includes(search.toLowerCase()) ||
      r.roll.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <RoleDashboardShell role={role} navItems={navItems}>
      <div className="space-y-6 max-w-8xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Wing B Residents Directory
            </h1>
            <p className="text-sm text-slate-500">
              48 Registered Residents • Block B (Floor 2), Hall 14 (HB-3)
            </p>
          </div>
          <div className="relative w-full sm:w-72">
            <SearchIcon className="absolute left-3 top-2.5 size-4 text-slate-400" />
            <Input
              placeholder="Search by name, room, roll no..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-white"
            />
          </div>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-white border-slate-200">
            <CardHeader className="pb-2">
              <CardDescription>Total Residents</CardDescription>
              <CardTitle className="text-2xl font-bold text-slate-900">48</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-slate-500">24 Double Rooms in Wing B</p>
            </CardContent>
          </Card>

          <Card className="bg-white border-slate-200">
            <CardHeader className="pb-2">
              <CardDescription>Active Wing Complaints</CardDescription>
              <CardTitle className="text-2xl font-bold text-amber-600">4</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-slate-500">2 Electrical, 2 Plumbing</p>
            </CardContent>
          </Card>

          <Card className="bg-white border-slate-200">
            <CardHeader className="pb-2">
              <CardDescription>Wing Hygiene Index</CardDescription>
              <CardTitle className="text-2xl font-bold text-emerald-600">94.2%</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-slate-500">Top 15% across campus</p>
            </CardContent>
          </Card>

          <Card className="bg-white border-slate-200">
            <CardHeader className="pb-2">
              <CardDescription>CR Endorsement Rate</CardDescription>
              <CardTitle className="text-2xl font-bold text-indigo-600">100%</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-slate-500">All student issues verified</p>
            </CardContent>
          </Card>
        </div>

        {/* Residents Table */}
        <Card className="bg-white border-slate-200">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-slate-900">
              Resident Rosters & Room Status
            </CardTitle>
            <CardDescription className="text-xs">
              Direct point of contact for Wing B student advocacy and facility issues.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 border-y border-slate-200 text-xs font-semibold text-slate-500 uppercase">
                  <tr>
                    <th className="px-4 py-3">Resident</th>
                    <th className="px-4 py-3">Room</th>
                    <th className="px-4 py-3">Roll & Dept</th>
                    <th className="px-4 py-3">Contact</th>
                    <th className="px-4 py-3">Active Tickets</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map((res) => (
                    <tr key={res.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3 font-medium text-slate-900 flex items-center gap-2">
                        <UsersIcon className="size-4 text-slate-400" />
                        {res.name}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className="font-mono bg-slate-50 text-slate-700">
                          {res.room}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-600">
                        <div>{res.roll}</div>
                        <div className="text-slate-400">{res.branch}</div>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-600">
                        <span className="inline-flex items-center gap-1 font-mono">
                          <PhoneIcon className="size-3 text-slate-400" />
                          {res.phone}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {res.complaints > 0 ? (
                          <Badge className="bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-100 gap-1 text-xs">
                            <AlertCircleIcon className="size-3" />
                            {res.complaints} Open
                          </Badge>
                        ) : (
                          <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-50 text-xs">
                            None
                          </Badge>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 text-xs text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
                          onClick={() => toast.success(`Contacting ${res.name} (${res.room})...`)}
                        >
                          Ping Resident
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </RoleDashboardShell>
  );
}
