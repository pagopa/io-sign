import { describe, it, expect, vi, afterEach } from "vitest";
import { PDFDocument, PDFForm, PDFPage } from "pdf-lib";

import * as E from "fp-ts/lib/Either";

import { getPdfMetadata, populatePdf, getPdfFieldsValue, Field } from "../pdf";

const createPdfBuffer = async (
  configure?: (form: PDFForm, page: PDFPage) => void
) => {
  const doc = await PDFDocument.create();
  const page = doc.addPage([200, 300]);
  configure?.(doc.getForm(), page);
  return Buffer.from(await doc.save());
};

const invalidPdfBuffer = Buffer.from("this is not a pdf");

afterEach(() => {
  vi.restoreAllMocks();
});

describe("getPdfMetadata", () => {
  it("extracts the pages and filters out non-signature form fields", async () => {
    const buffer = await createPdfBuffer((form, page) => {
      const textField = form.createTextField("name");
      textField.addToPage(page);
    });

    const result = await getPdfMetadata(buffer)();

    expect(result).toStrictEqual(
      E.right({
        formFields: [],
        pages: [{ number: 0, width: 200, height: 300 }]
      })
    );
  });

  it("returns Left when the buffer is not a valid pdf", async () => {
    const result = await getPdfMetadata(invalidPdfBuffer)();
    expect(E.isLeft(result)).toBe(true);
    if (E.isLeft(result)) {
      expect(result.left.message).toContain("No PDF header found");
    }
  });

  it("defaults to an empty formFields array when reading the form fields throws", async () => {
    const buffer = await createPdfBuffer();

    vi.spyOn(PDFDocument.prototype, "getForm").mockImplementationOnce(() => {
      throw new Error("cannot read form");
    });

    const result = await getPdfMetadata(buffer)();

    expect(result).toStrictEqual(
      E.right({
        formFields: [],
        pages: [{ number: 0, width: 200, height: 300 }]
      })
    );
  });

  it("returns Left when reading the pages throws", async () => {
    const buffer = await createPdfBuffer();

    vi.spyOn(PDFDocument.prototype, "getPages").mockImplementationOnce(() => {
      throw new Error("cannot read pages");
    });

    const result = await getPdfMetadata(buffer)();

    expect(E.isLeft(result)).toBe(true);
    if (E.isLeft(result)) {
      expect(result.left.message).toBe("cannot read pages");
    }
  });

  it("returns Left when the extracted metadata fails schema validation", async () => {
    const buffer = await createPdfBuffer();

    vi.spyOn(PDFDocument.prototype, "getForm").mockImplementationOnce(
      () =>
        ({
          getFields: () => [
            { constructor: { name: "PDFSignature" }, getName: () => 123 }
          ]
        }) as unknown as PDFForm
    );

    const result = await getPdfMetadata(buffer)();

    expect(E.isLeft(result)).toBe(true);
    if (E.isLeft(result)) {
      expect(result.left.name).toBe("ValidationError");
      expect(result.left.message).toBe(
        "Failed to extract metadata from pdf file!"
      );
    }
  });
});

describe("populatePdf", () => {
  it("sets the value of the given text fields and returns the updated pdf", async () => {
    const buffer = await createPdfBuffer((form, page) => {
      const field = form.createTextField("QUADROB_fullName");
      field.addToPage(page);
    });
    const fields: Field[] = [
      { fieldName: "QUADROB_fullName", fieldValue: "Mario Rossi" }
    ];

    const result = await populatePdf(fields)(buffer)();

    expect(E.isRight(result)).toBe(true);
    if (E.isRight(result)) {
      const populatedDoc = await PDFDocument.load(result.right);
      expect(populatedDoc.getForm().getTextField("QUADROB_fullName").getText()).toBe(
        "Mario Rossi"
      );
    }
  });

  it("returns Left when a field does not exist in pdf", async () => {
    const buffer = await createPdfBuffer();

    const result = await populatePdf([
      { fieldName: "missing", fieldValue: "test" }
    ])(buffer)();

    expect(E.isLeft(result)).toBe(true);
    if (E.isLeft(result)) {
      expect(result.left.message).toBe(
        'PDFDocument has no form field with the name "missing"'
      );
    }
  });

  it("returns Left when a field is not a text field", async () => {
    const buffer = await createPdfBuffer((form, page) => {
      const checkbox = form.createCheckBox("agree");
      checkbox.addToPage(page);
    });

    const result = await populatePdf([
      { fieldName: "agree", fieldValue: "x" }
    ])(buffer)();

    expect(E.isLeft(result)).toBe(true);
    if (E.isLeft(result)) {
      expect(result.left.message).toBe(
        'Expected field "agree" to be of type PDFTextField, but it is actually of type PDFCheckBox'
      );
    }
  });

  it("returns Left when the buffer is not a valid pdf", async () => {
    const result = await populatePdf([{ fieldName: "x", fieldValue: "y" }])(
      invalidPdfBuffer
    )();
    expect(E.isLeft(result)).toBe(true);
    if (E.isLeft(result)) {
      expect(result.left.message).toContain("No PDF header found");
    }
  });
});

describe("getPdfFieldsValue", () => {
  it("returns the value of the requested text fields", async () => {
    const buffer = await createPdfBuffer((form, page) => {
      const field = form.createTextField("QUADROB_fullName");
      field.setText("Mario Rossi");
      field.addToPage(page);
    });

    const result = await getPdfFieldsValue(["QUADROB_fullName"])(buffer)();

    expect(result).toStrictEqual(
      E.right([{ fieldName: "QUADROB_fullName", fieldValue: "Mario Rossi" }])
    );
  });

  it("returns Left when a field does not exist", async () => {
    const buffer = await createPdfBuffer();

    const result = await getPdfFieldsValue(["missing"])(buffer)();

    expect(E.isLeft(result)).toBe(true);
    if (E.isLeft(result)) {
      expect(result.left.message).toBe(
        'PDFDocument has no form field with the name "missing"'
      );
    }
  });

  it("returns Left (EntityNotFoundError) when a field has no value set", async () => {
    const buffer = await createPdfBuffer((form, page) => {
      const field = form.createTextField("fullName");
      field.addToPage(page);
    });

    const result = await getPdfFieldsValue(["fullName"])(buffer)();

    expect(E.isLeft(result)).toBe(true);
    if (E.isLeft(result)) {
      expect(result.left.name).toBe("EntityNotFoundError");
      expect(result.left.message).toBe("An error occurred while attempting to access the pdf field content.");
    }
  });

  it("returns Left when the buffer is not a valid pdf", async () => {
    const result = await getPdfFieldsValue(["x"])(invalidPdfBuffer)();
    expect(E.isLeft(result)).toBe(true);
    if (E.isLeft(result)) {
      expect(result.left.message).toContain("No PDF header found");
    }
  });
});
