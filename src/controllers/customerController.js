const prisma = require("../models/prisma");

exports.createCustomer = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      phone,
      nationalId,
      birthDate,
      gender,
      age,
      occupation,
      jobDetail,
      income,
      education,
      addresses = [],
    } = req.body;

    const customer = await prisma.customer.create({
      data: {
        firstName,
        lastName,
        email,
        phone,
        nationalId,
        birthDate: birthDate ? new Date(birthDate) : null,
        gender: gender || null,
        age: age ? parseInt(age) : null,
        occupation: occupation || null,
        jobDetail: jobDetail || null,
        income: income || null,
        education: education || null,
        addresses: {
          create: addresses.map((addr) => ({
            addressLine: addr.addressLine,
            subdistrict: addr.subdistrict,
            district: addr.district,
            province: addr.province,
            postalCode: addr.postalCode,
          })),
        },
      },
      include: { addresses: true },
    });

    res.status(201).json(customer);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getCustomers = async (req, res) => {
  try {
    const customers = await prisma.customer.findMany({
      include: { addresses: true, paylaterApps: true },
    });
    res.json(customers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getCustomer = async (req, res) => {
  try {
    const customer = await prisma.customer.findUnique({
      where: { id: parseInt(req.params.id) },
      include: { addresses: true, paylaterApps: true },
    });
    if (!customer) return res.status(404).json({ error: "Customer not found" });
    res.json(customer);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateCustomer = async (req, res) => {
  try {
    const customer = await prisma.customer.update({
      where: { id: parseInt(req.params.id) },
      data: req.body,
    });
    res.json(customer);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteCustomer = async (req, res) => {
  try {
    await prisma.customer.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ message: "Customer deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
