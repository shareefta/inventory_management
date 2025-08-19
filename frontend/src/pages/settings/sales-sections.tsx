import { useSnackbar } from "notistack";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  Breadcrumbs,
  Link,
  Typography,
  Box,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from "@mui/material";

import { getLocations } from "src/api/products";
import {
  getSections,
  createSection,
  updateSection,
  deleteSection,
  SalesSection,
  getChannels,
  SalesChannel,
} from "src/api/sales";

interface Location {
  id: number;
  name: string;
}

export default function SalesSectionsPage() {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();

  const [sections, setSections] = useState<SalesSection[]>([]);
  const [channels, setChannels] = useState<SalesChannel[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);

  // New section states
  const [newSectionName, setNewSectionName] = useState("");
  const [newChannelId, setNewChannelId] = useState<number | "">("");
  const [newLocationId, setNewLocationId] = useState<number | "">("");
  const [newBuildingNo, setNewBuildingNo] = useState("");
  const [newStreetNo, setNewStreetNo] = useState("");
  const [newZoneNo, setNewZoneNo] = useState("");
  const [newShortName, setNewShortName] = useState("");
  const [newLogo, setNewLogo] = useState<File | null>(null);

  // Edit states
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState("");
  const [editingChannelId, setEditingChannelId] = useState<number | "">("");
  const [editingLocationId, setEditingLocationId] = useState<number | "">("");
  const [editingBuildingNo, setEditingBuildingNo] = useState("");
  const [editingStreetNo, setEditingStreetNo] = useState("");
  const [editingZoneNo, setEditingZoneNo] = useState("");
  const [editingShortName, setEditingShortName] = useState("");
  const [editingLogo, setEditingLogo] = useState<File | null>(null);

  // Fetchers
  const fetchSections = async () => {
    try {
      const res = await getSections();
      setSections(res.data);
    } catch {
      enqueueSnackbar("Failed to fetch sections", { variant: "error" });
    }
  };

  const fetchChannels = async () => {
    try {
      const res = await getChannels();
      setChannels(res.data);
    } catch {
      enqueueSnackbar("Failed to fetch channels", { variant: "error" });
    }
  };

  const fetchLocations = async () => {
    try {
      const data = await getLocations();
      setLocations(data);
    } catch {
      enqueueSnackbar("Failed to fetch locations", { variant: "error" });
    }
  };

  useEffect(() => {
    fetchSections();
    fetchChannels();
    fetchLocations();
  }, []);

  // Handlers
  const handleAdd = async () => {
    if (!newSectionName || !newChannelId || !newLocationId) {
      enqueueSnackbar("Please fill all required fields", { variant: "warning" });
      return;
    }
    try {
      await createSection({
        name: newSectionName,
        channel_id: Number(newChannelId),
        location: Number(newLocationId),
        building_no: newBuildingNo,
        street_no: newStreetNo,
        zone_no: newZoneNo,
        short_name: newShortName,
        logo: newLogo,
      });
      enqueueSnackbar("Section added successfully!", { variant: "success" });
      // reset
      setNewSectionName("");
      setNewChannelId("");
      setNewLocationId("");
      setNewBuildingNo("");
      setNewStreetNo("");
      setNewZoneNo("");
      setNewShortName("");
      setNewLogo(null);
      fetchSections();
    } catch {
      enqueueSnackbar("Failed to add section", { variant: "error" });
    }
  };

  const handleUpdate = async (id: number) => {
    if (!editingName || !editingChannelId || !editingLocationId) {
      enqueueSnackbar("Please fill all required fields", { variant: "warning" });
      return;
    }
    try {
      await updateSection(id, {
        name: editingName,
        channel_id: Number(editingChannelId),
        location: Number(editingLocationId),
        building_no: editingBuildingNo,
        street_no: editingStreetNo,
        zone_no: editingZoneNo,
        short_name: editingShortName,
        logo: editingLogo,
      });
      enqueueSnackbar("Section updated successfully!", { variant: "success" });
      setEditingId(null);
      setEditingName("");
      setEditingChannelId("");
      setEditingLocationId("");
      setEditingBuildingNo("");
      setEditingStreetNo("");
      setEditingZoneNo("");
      setEditingShortName("");
      setEditingLogo(null);
      fetchSections();
    } catch {
      enqueueSnackbar("Failed to update section", { variant: "error" });
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this section?")) return;
    try {
      await deleteSection(id);
      enqueueSnackbar("Section deleted successfully!", { variant: "success" });
      fetchSections();
    } catch {
      enqueueSnackbar("Failed to delete section", { variant: "error" });
    }
  };

  return (
    <>
      {/* Breadcrumb */}
      <Breadcrumbs sx={{ mb: 2 }}>
        <Link component="button" onClick={() => navigate("/settings")}>
          Settings
        </Link>
        <Typography>Sales Sections</Typography>
      </Breadcrumbs>

      <Typography variant="h6" gutterBottom>
        Sales Sections
      </Typography>

      {/* Add Section */}
      <Box sx={{ maxWidth: 900, mb: 3 }}>
        <Box
          sx={{
            display: "flex",
            gap: 2,
            flexWrap: "wrap",
            p: 2,
            background: "linear-gradient(135deg, #f6d365 0%, #fda085 100%)",
            borderRadius: 2,
            boxShadow: 3,
            alignItems: "center",
          }}
        >
          <TextField
            label="Name"
            value={newSectionName}
            onChange={(e) => setNewSectionName(e.target.value)}
            size="small"
            sx={{ backgroundColor: "white" }}
          />
          <FormControl size="small" sx={{ minWidth: 150, backgroundColor: "white" }}>
            <InputLabel>Channel</InputLabel>
            <Select
              value={newChannelId}
              label="Channel"
              onChange={(e) => setNewChannelId(Number(e.target.value))}
            >
              {channels.map((ch) => (
                <MenuItem key={ch.id} value={ch.id}>
                  {ch.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 150, backgroundColor: "white" }}>
            <InputLabel>Location</InputLabel>
            <Select
              value={newLocationId}
              label="Location"
              onChange={(e) => setNewLocationId(Number(e.target.value))}
            >
              {locations.map((loc) => (
                <MenuItem key={loc.id} value={loc.id}>
                  {loc.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField label="Building" value={newBuildingNo} onChange={(e) => setNewBuildingNo(e.target.value)} size="small" />
          <TextField label="Street" value={newStreetNo} onChange={(e) => setNewStreetNo(e.target.value)} size="small" />
          <TextField label="Zone" value={newZoneNo} onChange={(e) => setNewZoneNo(e.target.value)} size="small" />
          <TextField label="Short Name" value={newShortName} onChange={(e) => setNewShortName(e.target.value)} size="small" />
          <Button variant="outlined" component="label">
            Upload Logo
            <input type="file" hidden accept="image/*" onChange={(e) => setNewLogo(e.target.files?.[0] || null)} />
          </Button>
          {newLogo && <Typography>{newLogo.name}</Typography>}
          <Button variant="contained" onClick={handleAdd}>Add Section</Button>
        </Box>
      </Box>

      {/* Table */}
      <TableContainer component={Paper} sx={{ maxWidth: 900, boxShadow: 3, borderRadius: 2 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>SL No</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Channel</TableCell>
              <TableCell>Location</TableCell>
              <TableCell>Building</TableCell>
              <TableCell>Street</TableCell>
              <TableCell>Zone</TableCell>
              <TableCell>Short Name</TableCell>
              <TableCell>Logo</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sections.map((section, index) => (
              <TableRow key={section.id}>
                <TableCell>{index + 1}</TableCell>
                <TableCell>
                  {editingId === section.id ? (
                    <TextField value={editingName} onChange={(e) => setEditingName(e.target.value)} size="small" />
                  ) : (
                    section.name
                  )}
                </TableCell>
                <TableCell>
                  {editingId === section.id ? (
                    <Select value={editingChannelId} size="small" onChange={(e) => setEditingChannelId(Number(e.target.value))}>
                      {channels.map((ch) => (
                        <MenuItem key={ch.id} value={ch.id}>
                          {ch.name}
                        </MenuItem>
                      ))}
                    </Select>
                  ) : (
                    section.channel.name
                  )}
                </TableCell>
                <TableCell>
                  {locations.find((loc) => loc.id === section.location)?.name || "—"}
                </TableCell>
                <TableCell>{section.building_no || "—"}</TableCell>
                <TableCell>{section.street_no || "—"}</TableCell>
                <TableCell>{section.zone_no || "—"}</TableCell>
                <TableCell>{section.short_name || "—"}</TableCell>
                <TableCell>{section.logo ? <img src={section.logo} alt="logo" width={40} /> : "—"}</TableCell>
                <TableCell>
                  {editingId === section.id ? (
                    <>
                      <Button size="small" onClick={() => handleUpdate(section.id)}>Save</Button>
                      <Button size="small" onClick={() => setEditingId(null)}>Cancel</Button>
                    </>
                  ) : (
                    <>
                      <Button size="small" onClick={() => {
                        setEditingId(section.id);
                        setEditingName(section.name);
                        setEditingChannelId(section.channel.id);
                        setEditingLocationId(section.location || "");
                        setEditingBuildingNo(section.building_no || "");
                        setEditingStreetNo(section.street_no || "");
                        setEditingZoneNo(section.zone_no || "");
                        setEditingShortName(section.short_name || "");
                      }}>Edit</Button>
                      <Button size="small" color="error" onClick={() => handleDelete(section.id)}>Delete</Button>
                    </>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </>
  );
}