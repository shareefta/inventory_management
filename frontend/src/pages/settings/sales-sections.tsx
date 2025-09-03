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
  const [newPlace, setNewPlace] = useState("");
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
  const [editingPlace, setEditingPlace] = useState("");
  const [editingShortName, setEditingShortName] = useState("");
  const [editingLogo, setEditingLogo] = useState<File | null>(null);

  // Fetchers
  const fetchSections = async () => {
    try {
      const sectionsData = await getSections();
      setSections(sectionsData);
    } catch {
      enqueueSnackbar("Failed to fetch sections", { variant: "error" });
    }
  };

  const fetchChannels = async () => {
    try {
      const channelsData = await getChannels();
      setChannels(channelsData);
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
        place: newPlace,
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
      setNewPlace("");
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
        place: editingPlace,
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
      setEditingPlace("");
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
      <Box sx={{ maxWidth: 1400, mb: 3 }}>
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
            label="Section Name"
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
            <InputLabel>Store</InputLabel>
            <Select
              value={newLocationId}
              label="Store"
              onChange={(e) => setNewLocationId(Number(e.target.value))}
            >
              {locations.map((loc) => (
                <MenuItem key={loc.id} value={loc.id}>
                  {loc.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            label="Building"
            value={newBuildingNo}
            onChange={(e) => setNewBuildingNo(e.target.value)}
            size="small"
            sx={{ backgroundColor: "white" }}
          />
          <TextField
            label="Street"
            value={newStreetNo}
            onChange={(e) => setNewStreetNo(e.target.value)}
            size="small"
            sx={{ backgroundColor: "white" }}
          />
          <TextField
            label="Zone"
            value={newZoneNo}
            onChange={(e) => setNewZoneNo(e.target.value)}
            size="small"
            sx={{ backgroundColor: "white" }}
          />
          <TextField
            label="Place"
            value={newPlace}
            onChange={(e) => setNewPlace(e.target.value)}
            size="small"
            sx={{ backgroundColor: "white" }}
          />
          <TextField
            label="Short Name"
            value={newShortName}
            onChange={(e) => setNewShortName(e.target.value)}
            size="small"
            sx={{ backgroundColor: "white" }}
          />
          <Button variant="outlined" component="label" size="small">
            Upload Logo
            <input
              type="file"
              hidden
              accept="image/*"
              onChange={(e) => setNewLogo(e.target.files?.[0] || null)}
            />
          </Button>
          {newLogo && <Typography>{newLogo.name}</Typography>}
          <Button variant="contained" onClick={handleAdd}>
            Add Section
          </Button>
        </Box>
      </Box>

      {/* Table */}
      <TableContainer component={Paper} sx={{ maxWidth: 1400, boxShadow: 3, borderRadius: 2 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{ textAlign: "center" }}>SL No</TableCell>
              <TableCell sx={{ textAlign: "center" }}>Section Name</TableCell>
              <TableCell sx={{ textAlign: "center" }}>Channel</TableCell>
              <TableCell sx={{ textAlign: "center" }}>Store</TableCell>
              <TableCell sx={{ textAlign: "center" }}>Building No.</TableCell>
              <TableCell sx={{ textAlign: "center" }}>Street No.</TableCell>
              <TableCell sx={{ textAlign: "center" }}>Zone No.</TableCell>
              <TableCell sx={{ textAlign: "center" }}>Place</TableCell>
              <TableCell sx={{ textAlign: "center" }}>Short Name</TableCell>
              <TableCell sx={{ textAlign: "center" }}>Logo</TableCell>
              <TableCell sx={{ textAlign: "center" }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sections.map((section, index) => (
              <TableRow key={section.id}>
                <TableCell sx={{ textAlign: "center" }}>{index + 1}</TableCell>

                {/* Name */}
                <TableCell>
                  {editingId === section.id ? (
                    <TextField
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      size="small"
                      sx={{ backgroundColor: "white", minWidth: 200 }}
                    />
                  ) : (
                    section.name
                  )}
                </TableCell>

                {/* Channel */}
                <TableCell sx={{ textAlign: "center" }}>
                  {editingId === section.id ? (
                    <Select
                      value={editingChannelId}
                      size="small"
                      onChange={(e) => setEditingChannelId(Number(e.target.value))}
                      sx={{ backgroundColor: "white" }}
                    >
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

                {/* Location */}
                <TableCell sx={{ textAlign: "center" }}>
                  {editingId === section.id ? (
                    <Select
                      value={editingLocationId}
                      size="small"
                      onChange={(e) => setEditingLocationId(Number(e.target.value))}
                      sx={{ backgroundColor: "white" }}
                    >
                      {locations.map((loc) => (
                        <MenuItem key={loc.id} value={loc.id}>
                          {loc.name}
                        </MenuItem>
                      ))}
                    </Select>
                  ) : (
                    locations.find((loc) => loc.id === section.location)?.name || "—"
                  )}
                </TableCell>

                {/* Building */}
                <TableCell sx={{ textAlign: "center" }}>
                  {editingId === section.id ? (
                    <TextField
                      value={editingBuildingNo}
                      size="small"
                      onChange={(e) => setEditingBuildingNo(e.target.value)}
                      sx={{ backgroundColor: "white" }}
                    />
                  ) : (
                    section.building_no || "—"
                  )}
                </TableCell>

                {/* Street */}
                <TableCell sx={{ textAlign: "center" }}>
                  {editingId === section.id ? (
                    <TextField
                      value={editingStreetNo}
                      size="small"
                      onChange={(e) => setEditingStreetNo(e.target.value)}
                      sx={{ backgroundColor: "white" }}
                    />
                  ) : (
                    section.street_no || "—"
                  )}
                </TableCell>

                {/* Zone */}
                <TableCell sx={{ textAlign: "center" }}>
                  {editingId === section.id ? (
                    <TextField
                      value={editingZoneNo}
                      size="small"
                      onChange={(e) => setEditingZoneNo(e.target.value)}
                      sx={{ backgroundColor: "white" }}
                    />
                  ) : (
                    section.zone_no || "—"
                  )}
                </TableCell>

                {/* Place */}
                <TableCell>
                  {editingId === section.id ? (
                    <TextField
                      value={editingPlace}
                      size="small"
                      onChange={(e) => setEditingPlace(e.target.value)}
                      sx={{ backgroundColor: "white", minWidth: 150 }}
                    />
                  ) : (
                    section.place || "—"
                  )}
                </TableCell> 

                {/* Short Name */}
                <TableCell sx={{ textAlign: "center" }}>
                  {editingId === section.id ? (
                    <TextField
                      value={editingShortName}
                      size="small"
                      onChange={(e) => setEditingShortName(e.target.value)}
                      sx={{ backgroundColor: "white" }}
                    />
                  ) : (
                    section.short_name || "—"
                  )}
                </TableCell>

                {/* Logo */}
                <TableCell sx={{ textAlign: "center" }}>
                  {editingId === section.id ? (
                    <>
                      <Button variant="outlined" component="label" size="small">
                        Upload Logo
                        <input
                          type="file"
                          hidden
                          accept="image/*"
                          onChange={(e) => setEditingLogo(e.target.files?.[0] || null)}
                        />
                      </Button>
                      {editingLogo && <Typography variant="caption">{editingLogo.name}</Typography>}
                    </>
                  ) : section.logo ? (
                    <img src={section.logo} alt="logo" width={40} />
                  ) : (
                    "—"
                  )}
                </TableCell>

                {/* Actions */}
                <TableCell sx={{ textAlign: "center" }}>
                  {editingId === section.id ? (
                    <>
                      <Button size="small" onClick={() => handleUpdate(section.id)}>
                        Save
                      </Button>
                      <Button size="small" onClick={() => setEditingId(null)}>
                        Cancel
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        size="small"
                        onClick={() => {
                          setEditingId(section.id);
                          setEditingName(section.name);
                          setEditingChannelId(section.channel.id);
                          setEditingLocationId(section.location || "");
                          setEditingBuildingNo(section.building_no || "");
                          setEditingStreetNo(section.street_no || "");
                          setEditingZoneNo(section.zone_no || "");
                          setEditingPlace(section.place || "");
                          setEditingShortName(section.short_name || "");
                        }}
                      >
                        Edit
                      </Button>
                      <Button size="small" color="error" onClick={() => handleDelete(section.id)}>
                        Delete
                      </Button>
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