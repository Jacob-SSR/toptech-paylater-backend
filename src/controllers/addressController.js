const prisma = require("../models/prisma");

exports.createAddress = async (req, res) => {
  try {
    const address = await prisma.address.create({
      data: req.body,
    });
    res.json(address);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getAddresses = async (req, res) => {
  try {
    const addresses = await prisma.address.findMany({
      include: { customer: true },
    });
    res.json(addresses);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getAddress = async (req, res) => {
  try {
    const address = await prisma.address.findUnique({
      where: { id: parseInt(req.params.id) },
      include: { customer: true },
    });
    if (!address) return res.status(404).json({ error: "Address not found" });
    res.json(address);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateAddress = async (req, res) => {
  try {
    const address = await prisma.address.update({
      where: { id: parseInt(req.params.id) },
      data: req.body,
    });
    res.json(address);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteAddress = async (req, res) => {
  try {
    await prisma.address.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ message: "Address deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
