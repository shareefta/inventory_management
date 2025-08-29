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
  PaymentMode,
  getPaymentModes,
  createPaymentMode,
  updatePaymentMode,
  deletePaymentMode,
} from "src/api/purchases";

export default function PaymentModesPage() {
  const { enqueueSnackbar } = useSnackbar();
  const [modes, setModes] = useState<PaymentMode[]>([]);

  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState("");

  const fetchModes = async () => {
    try {
      const data = await getPaymentModes();
      setModes(data);
    } catch {
      enqueueSnackbar("Failed to fetch payment modes", { variant: "error" });
    }
  };

  useEffect(() => {
    fetchModes();
  }, []);

  const handleAdd = async () => {
    if (!newName.trim()) {
      enqueueSnackbar("Please enter a name", { variant: "warning" });
      return; // just exit the function, no return value needed
    }

    try {
      await createPaymentMode({ name: newName });
      enqueueSnackbar("Payment mode added", { variant: "success" });
      setNewName("");
      fetchModes(); // or however you refresh the list
    } catch (err) {
      enqueueSnackbar("Failed to add payment mode", { variant: "error" });
    }
  };

  const handleUpdate = async (id: number) => {
    if (!editingName.trim()) {
      enqueueSnackbar("Name cannot be empty", { variant: "warning" });
      return; // exit without returning a value
    }

    try {
      await updatePaymentMode(id, { name: editingName });
      enqueueSnackbar("Updated successfully", { variant: "success" });
      setEditingName("");
      fetchModes(); // refresh list
    } catch (err) {
      enqueueSnackbar("Failed to update", { variant: "error" });
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this payment mode?")) return;
    try {
      await deletePaymentMode(id);
      enqueueSnackbar("Payment mode deleted!", { variant: "success" });
      fetchModes();
    } catch {
      enqueueSnackbar("Failed to delete payment mode", { variant: "error" });
    }
  };

  return (
    <Box>
      <Typography variant="h5" mb={2}>
        Payment Modes
      </Typography>

      {/* Add Payment Mode */}
      <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
        <TextField
          label="New Payment Mode"
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
            {modes.map((mode, index) => (
              <TableRow key={mode.id}>
                <TableCell>{index + 1}</TableCell>
                <TableCell>
                  {editingId === mode.id ? (
                    <TextField
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      size="small"
                    />
                  ) : (
                    mode.name
                  )}
                </TableCell>
                <TableCell>
                  {editingId === mode.id ? (
                    <>
                      <Button size="small" onClick={() => handleUpdate(mode.id!)}>
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
                          setEditingId(mode.id!);
                          setEditingName(mode.name);
                        }}
                      >
                        Edit
                      </Button>
                      <Button size="small" color="error" onClick={() => handleDelete(mode.id!)}>
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
