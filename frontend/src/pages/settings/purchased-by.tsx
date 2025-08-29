import { useSnackbar } from "notistack";
import { useEffect, useState } from "react";

import {
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
  Typography,
} from "@mui/material";

import {
  PurchasedBy,
  getPurchasedBys,
  createPurchasedBy,
  updatePurchasedBy,
  deletePurchasedBy,
} from "src/api/purchases";

export default function PurchasedByPage() {
  const { enqueueSnackbar } = useSnackbar();
  const [purchasers, setPurchasers] = useState<PurchasedBy[]>([]);

  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState("");

  const fetchPurchasers = async () => {
    try {
      const data = await getPurchasedBys();
      setPurchasers(data);
    } catch {
      enqueueSnackbar("Failed to fetch purchased by", { variant: "error" });
    }
  };

  useEffect(() => {
    fetchPurchasers();
  }, []);

  const handleAdd = async () => {
    if (!newName.trim()) {
      enqueueSnackbar("Please enter a name", { variant: "warning" });
      return; // exit function without returning a value
    }

    try {
      await createPurchasedBy({ name: newName });
      enqueueSnackbar("Added successfully", { variant: "success" });
      setNewName("");
      fetchPurchasers(); // refresh list
    } catch (err) {
      enqueueSnackbar("Failed to add", { variant: "error" });
    }
  };

  const handleUpdate = async (id: number) => {
    if (!editingName.trim()) {
      enqueueSnackbar("Name cannot be empty", { variant: "warning" });
      return; // exit without returning a value
    }

    try {
      await updatePurchasedBy(id, { name: editingName });
      enqueueSnackbar("Updated successfully", { variant: "success" });
      setEditingName("");
      fetchPurchasers(); // refresh the list
    } catch (err) {
      enqueueSnackbar("Failed to update", { variant: "error" });
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this item?")) return;
    try {
      await deletePurchasedBy(id);
      enqueueSnackbar("Purchased by deleted!", { variant: "success" });
      fetchPurchasers();
    } catch {
      enqueueSnackbar("Failed to delete purchased by", { variant: "error" });
    }
  };

  return (
    <Box>
      <Typography variant="h5" mb={2}>
        Purchased By
      </Typography>

      {/* Add */}
      <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
        <TextField
          label="New Purchased By"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          size="small"
        />
        <Button variant="contained" onClick={handleAdd}>
          Add
        </Button>
      </Box>

      {/* Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>SL No</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {purchasers.map((p, index) => (
              <TableRow key={p.id}>
                <TableCell>{index + 1}</TableCell>
                <TableCell>
                  {editingId === p.id ? (
                    <TextField
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      size="small"
                    />
                  ) : (
                    p.name
                  )}
                </TableCell>
                <TableCell>
                  {editingId === p.id ? (
                    <>
                      <Button size="small" onClick={() => handleUpdate(p.id!)}>
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
                          setEditingId(p.id!);
                          setEditingName(p.name);
                        }}
                      >
                        Edit
                      </Button>
                      <Button size="small" color="error" onClick={() => handleDelete(p.id!)}>
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
    </Box>
  );
}
