const db = require("../db");
const express = require("express");
const router = express.Router();
const ExpressError = require("../expressError");
const app = require("../app");

router.get("/", async function (req, res, next) {
  try {
    const results = await db.query(`SELECT id, comp_code, amt, paid, add_date, paid_date FROM invoices`);

    return res.json(results.rows);
  } catch (err) {
    return next(err);
  }
});

router.get("/:id", async function (req, res, next) {
  try {
    const invoiceQuery = await db.query(
      "SELECT comp_code, amt, paid, add_date, paid_date FROM invoices WHERE id = $1",
      [req.params.id]
    );

    if (invoiceQuery.rows.length === 0) {
      let notFoundError = new Error(`There is no invoice with that id '${req.params.id}`);
      notFoundError.status = 404;
      throw notFoundError;
    }
    return res.json({ invoices: invoiceQuery.rows[0] });
  } catch (err) {
    return next(err);
  }
});

router.post("/", async function (req, res, next) {
  try {
    const { comp_code, amt } = req.body;

    const result = await db.query(
      `INSERT INTO invoices (comp_code, amt) 
           VALUES ($1, $2) 
           RETURNING id, comp_code, amt, paid, add_date, paid_date`,
      [comp_code, amt]
    );

    return res.status(201).json({ invoice: result.rows[0] });
  } catch (err) {
    return next(err);
  }
});

router.put("/:id", async function (req, res, next) {
  try {
    if ("id" in req.body) {
      throw new ExpressError("Not allowed", 400);
    }

    const result = await db.query(
      `UPDATE invoices
            SET amt = $1
            WHERE id = $2
            RETURNING id, comp_code, amt, paid, add_date, paid_date`,
      [req.body.amt, req.params.id]
    );

    if (result.rows.length === 0) {
      throw new ExpressError(`There is no invoice with id of '${req.params.id}`, 404);
    }

    return res.status(201).json({ invoice: result.rows[0] });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
