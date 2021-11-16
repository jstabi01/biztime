const db = require("../db");
const express = require("express");
const router = express.Router();
const ExpressError = require("../expressError");
const app = require("../app");

router.get("/", async function (req, res, next) {
  try {
    const results = await db.query(`SELECT code, name, description FROM companies`);

    return res.json(results.rows);
  } catch (err) {
    return next(err);
  }
});

router.get("/:code", async function (req, res, next) {
  try {
    const companyQuery = await db.query(
      "SELECT code, name, description FROM companies WHERE code = $1",
      [req.params.code]
    );

    const invoiceQuery = await db.query(
      `SELECT id
       FROM invoices
       WHERE comp_code = $1`,
      [req.params.code]
    );

    if (companyQuery.rows.length === 0) {
      let notFoundError = new Error(`There is no company with code '${req.params.code}`);
      notFoundError.status = 404;
      throw notFoundError;
    }

    const company = companyQuery.rows[0];
    const invoices = invoiceQuery.rows;

    company.invoices = invoices.map((inv) => inv.id);

    return res.json({ company: company });
  } catch (err) {
    return next(err);
  }
});

router.post("/", async function (req, res, next) {
  try {
    const { code, name, description } = req.body;

    const result = await db.query(
      `INSERT INTO companies (code, name, description) 
         VALUES ($1, $2, $3) 
         RETURNING code, name, description`,
      [code, name, description]
    );

    return res.status(201).json({ company: result.rows[0] });
  } catch (err) {
    return next(err);
  }
});

router.put("/:code", async function (req, res, next) {
  try {
    if ("code" in req.body) {
      throw new ExpressError("Not allowed", 400);
    }

    const result = await db.query(
      `UPDATE companies
          SET name = $1, description = $2
          WHERE code = $3
          RETURNING code, name, description`,
      [req.body.name, req.body.description, req.params.code]
    );

    if (result.rows.length === 0) {
      throw new ExpressError(`There is no company with code of '${req.params.code}`, 404);
    }

    return res.status(201).json({ company: result.rows[0] });
  } catch (err) {
    return next(err);
  }
});

router.delete("/:code", async function (req, res, next) {
  try {
    const result = await db.query("DELETE FROM companies WHERE code = $1 RETURNING code", [
      req.params.code,
    ]);

    if (result.rows.length === 0) {
      throw new ExpressError(`There is no company with a code of '${req.params.code}`, 404);
    }
    return res.json({ message: "Company deleted" });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
