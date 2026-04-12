"use client"

import { useEffect, useRef, useState } from "react"
import { clearAuthSession, getAuthHeaders, isAuthFailureStatus, parseJsonSafe } from "@/lib/client-auth"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  User,
  Plus,
  Search,
  Hash,
  Home,
  DoorOpen,
  CheckCircle2,
  Upload,
} from "lucide-react"

type Student = {
  id: string
  name: string
  registerNumber: string
  hostel: string
  room: string
  email: string
  phone: string
  photoUrl: string
}

export function StudentAccounts() {
  const [students, setStudents] = useState<Student[]>([])
  const [loadingStudents, setLoadingStudents] = useState(true)
  const [creating, setCreating] = useState(false)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [photoUrl, setPhotoUrl] = useState<string>("/placeholder-student.jpg")
  const [photoError, setPhotoError] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [createOpen, setCreateOpen] = useState(false)
  const [created, setCreated] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [newStudent, setNewStudent] = useState({
    name: "",
    registerNumber: "",
    hostel: "",
    room: "",
    email: "",
    phone: "",
  })

  const filtered = students.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.registerNumber.toLowerCase().includes(search.toLowerCase())
  )

  const loadStudents = async () => {
    try {
      setLoadingStudents(true)
      const headers = { ...getAuthHeaders() }
      if (!headers.Authorization) {
        setStudents([])
        return
      }

      const response = await fetch('/api/admin/students', { cache: 'no-store', headers })
      if (!response.ok) {
        const errorBody = await parseJsonSafe(response)
        if (isAuthFailureStatus(response.status)) {
          clearAuthSession()
          window.location.reload()
          return
        }
        console.error('Failed to fetch students:', {
          status: response.status,
          error: errorBody?.error || 'Unknown error',
        })
        setStudents([])
        return
      }

      const data = await parseJsonSafe(response)
      const mapped: Student[] = (data.students || []).map((s: any) => ({
        id: s.user_id || s.id,
        name: s.name,
        registerNumber: s.registerNumber,
        hostel: s.hostel,
        room: s.room,
        email: s.email,
        phone: s.phone,
        photoUrl: s.photoUrl || '/placeholder-student.jpg',
      }))

      setStudents(mapped)
    } catch (error) {
      console.error('Error loading students:', error)
      setStudents([])
    } finally {
      setLoadingStudents(false)
    }
  }

  useEffect(() => {
    loadStudents()
  }, [])

  const handleSelectPhoto = () => {
    fileInputRef.current?.click()
  }

  const handlePhotoChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      setUploadingPhoto(true)
      setPhotoError(null)

      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/admin/upload-photo', {
        method: 'POST',
        headers: { ...getAuthHeaders() },
        body: formData,
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || 'Failed to upload photo')
      }

      setPhotoUrl(data.publicUrl)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to upload photo'
      setPhotoError(message)
    } finally {
      setUploadingPhoto(false)
      if (event.target) {
        event.target.value = ''
      }
    }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!photoUrl || photoUrl === '/placeholder-student.jpg') {
      alert('Photo is required')
      return
    }

    try {
      setCreating(true)
      const response = await fetch('/api/admin/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({
          name: newStudent.name,
          email: newStudent.email,
          registerNumber: newStudent.registerNumber,
          hostel: newStudent.hostel,
          room: newStudent.room,
          phone: newStudent.phone,
          photoUrl,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        alert(`Error: ${data.error || 'Failed to create student'}`)
        return
      }

      const data = await response.json()
      // Re-fetch from API to ensure DB truth
      await loadStudents()
      setCreated(true)
      setTimeout(() => {
        setCreateOpen(false)
        setCreated(false)
        setNewStudent({ name: "", registerNumber: "", hostel: "", room: "", email: "", phone: "" })
        setPhotoUrl('/placeholder-student.jpg')
        setPhotoError(null)
      }, 1500)
    } catch (error) {
      console.error('Error creating student:', error)
      alert('Error creating student. Please try again.')
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Student Accounts</h1>
          <p className="text-muted-foreground">Create and manage student accounts</p>
        </div>
        <Button className="gap-2" onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4" />
          Create Student
        </Button>
      </div>

      {/* Search */}
      <Card className="border-border/60">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or register number..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 bg-background text-foreground"
            />
          </div>
        </CardContent>
      </Card>

      {/* Student List */}
      <Card className="border-border/60">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-border">
                <TableHead className="text-muted-foreground">Student</TableHead>
                <TableHead className="text-muted-foreground">Register No.</TableHead>
                <TableHead className="hidden md:table-cell text-muted-foreground">Hostel</TableHead>
                <TableHead className="hidden md:table-cell text-muted-foreground">Room</TableHead>
                <TableHead className="hidden lg:table-cell text-muted-foreground">Contact</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loadingStudents && (
                <TableRow className="border-border">
                  <TableCell colSpan={5} className="text-center text-sm text-muted-foreground py-8">
                    Loading students...
                  </TableCell>
                </TableRow>
              )}
              {filtered.map(student => (
                <TableRow key={student.id} className="border-border">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                        <User className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{student.name}</p>
                        <p className="text-xs text-muted-foreground">{student.id}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-mono text-xs">{student.registerNumber}</Badge>
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-sm text-muted-foreground">{student.hostel}</TableCell>
                  <TableCell className="hidden md:table-cell text-sm text-foreground font-mono">{student.room}</TableCell>
                  <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">{student.email}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground text-center">
        Showing {filtered.length} of {students.length} students
      </p>

      {/* Create Student Dialog */}
      <Dialog open={createOpen} onOpenChange={() => { setCreateOpen(false); setCreated(false) }}>
        <DialogContent className="sm:max-w-lg">
          {!created ? (
            <form onSubmit={handleCreate}>
              <DialogHeader>
                <DialogTitle className="text-foreground">Create Student Account</DialogTitle>
                <DialogDescription>
                  Enter student details to create account. A login user will be created automatically with password: password123
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                {/* Photo Upload Placeholder */}
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 rounded-xl bg-muted flex items-center justify-center border-2 border-dashed border-border overflow-hidden">
                    {photoUrl !== '/placeholder-student.jpg' ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={photoUrl} alt="Student" className="h-full w-full object-cover" />
                    ) : (
                      <Upload className="h-6 w-6 text-muted-foreground" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">Profile Photo</p>
                    <p className="text-xs text-muted-foreground">Upload student photo (required)</p>
                    <Button
                      variant="outline"
                      size="sm"
                      type="button"
                      className="mt-1 text-xs"
                      onClick={handleSelectPhoto}
                      disabled={uploadingPhoto}
                    >
                      {uploadingPhoto ? 'Uploading...' : 'Choose File'}
                    </Button>
                    <Input
                      ref={fileInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      className="hidden"
                      onChange={handlePhotoChange}
                    />
                    {photoError && <p className="text-xs text-destructive mt-1">{photoError}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2 col-span-2">
                    <Label htmlFor="name" className="text-foreground">Full Name</Label>
                    <Input
                      id="name"
                      placeholder="e.g. Arjun Kumar"
                      value={newStudent.name}
                      onChange={e => setNewStudent({ ...newStudent, name: e.target.value })}
                      className="bg-background text-foreground"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="regNo" className="text-foreground">Register Number</Label>
                    <Input
                      id="regNo"
                      placeholder="e.g. 21BCE1234"
                      value={newStudent.registerNumber}
                      onChange={e => setNewStudent({ ...newStudent, registerNumber: e.target.value })}
                      className="bg-background text-foreground"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="hostel" className="text-foreground">Hostel Block</Label>
                    <Input
                      id="hostel"
                      placeholder="e.g. Men's Hostel Block A"
                      value={newStudent.hostel}
                      onChange={e => setNewStudent({ ...newStudent, hostel: e.target.value })}
                      className="bg-background text-foreground"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="room" className="text-foreground">Room Number</Label>
                    <Input
                      id="room"
                      placeholder="e.g. A-304"
                      value={newStudent.room}
                      onChange={e => setNewStudent({ ...newStudent, room: e.target.value })}
                      className="bg-background text-foreground"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-foreground">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="student@college.edu"
                      value={newStudent.email}
                      onChange={e => setNewStudent({ ...newStudent, email: e.target.value })}
                      className="bg-background text-foreground"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-foreground">Phone</Label>
                    <Input
                      id="phone"
                      placeholder="+91 ..."
                      value={newStudent.phone}
                      onChange={e => setNewStudent({ ...newStudent, phone: e.target.value })}
                      className="bg-background text-foreground"
                    />
                  </div>
                </div>
              </div>
              <DialogFooter className="gap-2 sm:gap-0">
                <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
                <Button type="submit" className="gap-2" disabled={creating || uploadingPhoto}>
                  <Plus className="h-4 w-4" />
                  {creating ? 'Creating...' : 'Create Account'}
                </Button>
              </DialogFooter>
            </form>
          ) : (
            <div className="flex flex-col items-center gap-4 py-6">
              <div className="h-16 w-16 rounded-full bg-success/10 flex items-center justify-center">
                <CheckCircle2 className="h-8 w-8 text-success" />
              </div>
              <div className="text-center">
                <h3 className="text-lg font-semibold text-foreground">Account Created!</h3>
                <p className="text-sm text-muted-foreground">Student can log in with their email and password: <code className="bg-muted p-1 rounded">password123</code></p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
