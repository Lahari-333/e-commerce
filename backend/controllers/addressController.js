const db = require("../config/db");

/**
 * GET /api/addresses
 * Retrieve all addresses belonging to the authenticated customer
 */
async function getAddresses(req, res) {
  try {
    const userId = req.user.id;

    const query = `
      SELECT 
        id,
        user_id,
        address_type,
        is_default,
        full_name,
        phone,
        address_line1,
        address_line2,
        city,
        state,
        postal_code,
        country,
        created_at,
        updated_at
      FROM addresses
      WHERE user_id = ?
      ORDER BY is_default DESC, created_at DESC
    `;

    const [rows] = await db.query(query, [userId]);

    return res.status(200).json({
      success: true,
      data: rows
    });
  } catch (error) {
    console.error("Error fetching addresses:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve addresses"
    });
  }
}

/**
 * POST /api/addresses
 * Create a new address for the authenticated customer
 */
async function createAddress(req, res) {
  try {
    const userId = req.user.id;
    const {
      full_name,
      phone,
      address_line1,
      address_line2,
      city,
      state,
      postal_code,
      country,
      is_default,
      address_type
    } = req.body;

    // Validation
    if (!full_name || typeof full_name !== "string" || full_name.trim() === "") {
      return res.status(400).json({ success: false, message: "Full name is required" });
    }
    if (!phone || typeof phone !== "string" || phone.trim() === "") {
      return res.status(400).json({ success: false, message: "Phone number is required" });
    }
    if (!address_line1 || typeof address_line1 !== "string" || address_line1.trim() === "") {
      return res.status(400).json({ success: false, message: "Address line 1 is required" });
    }
    if (!city || typeof city !== "string" || city.trim() === "") {
      return res.status(400).json({ success: false, message: "City is required" });
    }
    if (!state || typeof state !== "string" || state.trim() === "") {
      return res.status(400).json({ success: false, message: "State is required" });
    }
    if (!postal_code || typeof postal_code !== "string" || postal_code.trim() === "") {
      return res.status(400).json({ success: false, message: "Postal code is required" });
    }
    const cleanCountry = country && country.trim() !== "" ? country.trim() : "India";

    // Check existing address count for default handling
    const [countRows] = await db.query(
      "SELECT COUNT(*) AS total FROM addresses WHERE user_id = ?",
      [userId]
    );
    const existingCount = countRows[0].total;

    // If first address or explicitly requested as default, mark default
    const shouldBeDefault = existingCount === 0 || Boolean(is_default);

    if (shouldBeDefault) {
      await db.query("UPDATE addresses SET is_default = 0 WHERE user_id = ?", [userId]);
    }

    const insertQuery = `
      INSERT INTO addresses (
        user_id,
        address_type,
        is_default,
        full_name,
        phone,
        address_line1,
        address_line2,
        city,
        state,
        postal_code,
        country
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const [result] = await db.query(insertQuery, [
      userId,
      address_type || "shipping",
      shouldBeDefault ? 1 : 0,
      full_name.trim(),
      phone.trim(),
      address_line1.trim(),
      address_line2 ? address_line2.trim() : null,
      city.trim(),
      state.trim(),
      postal_code.trim(),
      cleanCountry
    ]);

    const [createdRows] = await db.query("SELECT * FROM addresses WHERE id = ? LIMIT 1", [
      result.insertId
    ]);

    return res.status(201).json({
      success: true,
      message: "Address created successfully",
      data: createdRows[0]
    });
  } catch (error) {
    console.error("Error creating address:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to create address"
    });
  }
}

/**
 * PATCH /api/addresses/:id
 * Update an existing address belonging to the authenticated customer
 */
async function updateAddress(req, res) {
  try {
    const userId = req.user.id;
    const addressId = parseInt(req.params.id, 10);

    if (!addressId || isNaN(addressId)) {
      return res.status(400).json({ success: false, message: "Valid address ID is required" });
    }

    // Verify ownership
    const [existing] = await db.query(
      "SELECT id, is_default FROM addresses WHERE id = ? AND user_id = ? LIMIT 1",
      [addressId, userId]
    );

    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Address not found or does not belong to your account"
      });
    }

    const {
      full_name,
      phone,
      address_line1,
      address_line2,
      city,
      state,
      postal_code,
      country,
      is_default,
      address_type
    } = req.body;

    if (is_default) {
      await db.query("UPDATE addresses SET is_default = 0 WHERE user_id = ?", [userId]);
    }

    const updateFields = [];
    const updateParams = [];

    if (full_name !== undefined) {
      updateFields.push("full_name = ?");
      updateParams.push(full_name.trim());
    }
    if (phone !== undefined) {
      updateFields.push("phone = ?");
      updateParams.push(phone.trim());
    }
    if (address_line1 !== undefined) {
      updateFields.push("address_line1 = ?");
      updateParams.push(address_line1.trim());
    }
    if (address_line2 !== undefined) {
      updateFields.push("address_line2 = ?");
      updateParams.push(address_line2 ? address_line2.trim() : null);
    }
    if (city !== undefined) {
      updateFields.push("city = ?");
      updateParams.push(city.trim());
    }
    if (state !== undefined) {
      updateFields.push("state = ?");
      updateParams.push(state.trim());
    }
    if (postal_code !== undefined) {
      updateFields.push("postal_code = ?");
      updateParams.push(postal_code.trim());
    }
    if (country !== undefined) {
      updateFields.push("country = ?");
      updateParams.push(country.trim());
    }
    if (is_default !== undefined) {
      updateFields.push("is_default = ?");
      updateParams.push(is_default ? 1 : 0);
    }
    if (address_type !== undefined) {
      updateFields.push("address_type = ?");
      updateParams.push(address_type);
    }

    if (updateFields.length > 0) {
      updateParams.push(addressId, userId);
      const updateQuery = `UPDATE addresses SET ${updateFields.join(", ")} WHERE id = ? AND user_id = ?`;
      await db.query(updateQuery, updateParams);
    }

    const [updatedRows] = await db.query("SELECT * FROM addresses WHERE id = ? LIMIT 1", [
      addressId
    ]);

    return res.status(200).json({
      success: true,
      message: "Address updated successfully",
      data: updatedRows[0]
    });
  } catch (error) {
    console.error("Error updating address:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to update address"
    });
  }
}

/**
 * DELETE /api/addresses/:id
 * Delete an address belonging to the authenticated customer
 */
async function deleteAddress(req, res) {
  try {
    const userId = req.user.id;
    const addressId = parseInt(req.params.id, 10);

    if (!addressId || isNaN(addressId)) {
      return res.status(400).json({ success: false, message: "Valid address ID is required" });
    }

    const [existing] = await db.query(
      "SELECT id, is_default FROM addresses WHERE id = ? AND user_id = ? LIMIT 1",
      [addressId, userId]
    );

    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Address not found or does not belong to your account"
      });
    }

    const wasDefault = existing[0].is_default;

    await db.query("DELETE FROM addresses WHERE id = ? AND user_id = ?", [addressId, userId]);

    // If default address was deleted, promote another remaining address to default
    if (wasDefault) {
      const [remaining] = await db.query(
        "SELECT id FROM addresses WHERE user_id = ? ORDER BY created_at DESC LIMIT 1",
        [userId]
      );
      if (remaining.length > 0) {
        await db.query("UPDATE addresses SET is_default = 1 WHERE id = ?", [remaining[0].id]);
      }
    }

    return res.status(200).json({
      success: true,
      message: "Address deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting address:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to delete address"
    });
  }
}

module.exports = {
  getAddresses,
  createAddress,
  updateAddress,
  deleteAddress
};
