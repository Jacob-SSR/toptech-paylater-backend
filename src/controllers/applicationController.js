const prisma = require("../models/prisma");
const axios = require("axios");

exports.createApplication = async (req, res) => {
  try {
    const {
      customerId,
      productId,
      serviceType,
      downPayment,
      installments,
      monthlyAmount,
      referralCode,
    } = req.body;

    const application = await prisma.paylaterApplication.create({
      data: {
        customerId,
        productId,
        serviceType,
        downPayment,
        installments,
        monthlyAmount,
        referralCode,
      },
      include: { customer: true, product: true },
    });

    if (referralCode) {
      try {
        await axios.post(`${process.env.AFFILIATE_API_URL}/affiliate/lead`, {
          referralCode,
          name: `${application.customer.firstName} ${application.customer.lastName}`,
          email: application.customer.email,
          phone: application.customer.phone,
        });
      } catch (err) {
        console.error("Error calling Affiliate Service:", err.message);
      }
    }

    res.status(201).json({ message: "Application created", application });
  } catch (err) {
    console.error("CREATE APPLICATION ERROR:", err);
    res.status(500).json({ error: err.message });
  }
};

exports.getApplications = async (req, res) => {
  try {
    const apps = await prisma.paylaterApplication.findMany({
      include: { customer: true, product: true },
    });
    res.json(apps);
  } catch (err) {
    console.error("GET APPLICATIONS ERROR:", err);
    res.status(500).json({ error: err.message });
  }
};

exports.getApplication = async (req, res) => {
  try {
    const app = await prisma.paylaterApplication.findUnique({
      where: { id: parseInt(req.params.id) },
      include: { customer: true, product: true },
    });
    if (!app) return res.status(404).json({ error: "Application not found" });
    res.json(app);
  } catch (err) {
    console.error("GET APPLICATION ERROR:", err);
    res.status(500).json({ error: err.message });
  }
};

exports.updateApplication = async (req, res) => {
  try {
    const app = await prisma.paylaterApplication.update({
      where: { id: parseInt(req.params.id) },
      data: req.body,
    });
    res.json(app);
  } catch (err) {
    console.error("UPDATE APPLICATION ERROR:", err);
    res.status(500).json({ error: err.message });
  }
};

exports.deleteApplication = async (req, res) => {
  try {
    await prisma.paylaterApplication.delete({
      where: { id: parseInt(req.params.id) },
    });
    res.json({ message: "Application deleted" });
  } catch (err) {
    console.error("DELETE APPLICATION ERROR:", err);
    res.status(500).json({ error: err.message });
  }
};
