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

    if (!customerId || !productId) {
      return res.status(400).json({
        error: "ต้องเลือกสินค้า (productId) และลูกค้า (customerId) ก่อน",
      });
    }

    const application = await prisma.paylaterApplication.create({
      data: {
        customerId: parseInt(customerId),
        productId: parseInt(productId),
        serviceType,
        downPayment: downPayment ? new Prisma.Decimal(downPayment) : null,
        installments: installments ? parseInt(installments) : null,
        monthlyAmount: monthlyAmount ? new Prisma.Decimal(monthlyAmount) : null,
        referralCode: referralCode || null,
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
        res.status(500).json({ error: err.message });
      }
    }

    res.status(201).json({ data: application });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getApplications = async (req, res) => {
  try {
    const apps = await prisma.paylaterApplication.findMany({
      include: { customer: true, product: true },
    });
    res.json({ data: apps });
  } catch (err) {
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
    res.json({ data: app });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateApplication = async (req, res) => {
  try {
    const { status, downPayment, installments, monthlyAmount } = req.body;

    const app = await prisma.paylaterApplication.update({
      where: { id: parseInt(req.params.id) },
      data: {
        ...(status && { status }),
        ...(downPayment && { downPayment: new Prisma.Decimal(downPayment) }),
        ...(installments && { installments: parseInt(installments) }),
        ...(monthlyAmount && {
          monthlyAmount: new Prisma.Decimal(monthlyAmount),
        }),
      },
      include: { customer: true, product: true },
    });

    res.json({ data: app });
  } catch (err) {
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
    res.status(500).json({ error: err.message });
  }
};
