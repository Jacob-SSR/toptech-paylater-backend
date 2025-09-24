const prisma = require("../models/prisma");

exports.createApplication = async (req, res) => {
  try {
    const app = await prisma.paylaterApplication.create({
      data: req.body,
      include: { customer: true, product: true },
    });

    if (app.referralCode) {
      const affiliate = await prisma.affiliate.findUnique({
        where: { code: app.referralCode },
      });

      if (affiliate) {
        const order = await prisma.order.create({
          data: {
            lead: {
              connectOrCreate: {
                where: {
                  affiliateId_email: {
                    affiliateId: affiliate.id,
                    email:
                      app.customer.email ||
                      `${app.customer.phone}@placeholder.com`,
                  },
                },
                create: {
                  affiliateId: affiliate.id,
                  name: `${app.customer.firstName} ${app.customer.lastName}`,
                  email:
                    app.customer.email ||
                    `${app.customer.phone}@placeholder.com`,
                  phone: app.customer.phone,
                  sourceCampaign: "Paylater",
                },
              },
            },
            totalAmount: app.product.price,
            downPayment: app.downPayment || 0,
            installments: app.installments || 1,
            status: "APPROVED",
          },
        });

        const rule = await prisma.commissionRule.findFirst({
          where: { active: true },
        });

        let commissionAmount = 0;
        if (rule) {
          if (rule.type === "FLAT") {
            commissionAmount = parseFloat(rule.parameters?.flat || 0);
          } else if (rule.type === "PERCENTAGE") {
            commissionAmount =
              (parseFloat(app.product.price) *
                parseFloat(rule.parameters?.percent || 0)) /
              100;
          }
        }

        await prisma.commission.create({
          data: {
            orderId: order.id,
            affiliateId: affiliate.id,
            ruleId: rule ? rule.id : null,
            amount: commissionAmount,
            status: "PENDING",
          },
        });
      }
    }

    res.status(201).json(app);
  } catch (err) {
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
