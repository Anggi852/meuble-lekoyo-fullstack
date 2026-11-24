import Joi from 'joi';

const photoItemSchema = Joi.object({
  url: Joi.string().trim().min(1).required(),
  label: Joi.string().trim().max(80).default('Tampak Depan'),
});

export const loginSchema = Joi.object({
  password: Joi.string().trim().min(1).required().messages({
    'any.required': 'Password wajib diisi.',
    'string.empty': 'Password wajib diisi.',
  }),
});

export const productSchema = Joi.object({
  name: Joi.string().trim().min(2).max(160).required(),
  category: Joi.string().trim().min(2).max(60).required(),
  price: Joi.number().integer().min(1000).max(500000000).required(),
  description: Joi.string().trim().min(5).max(1500).required(),
  material: Joi.string().trim().min(2).max(120).default('Kayu Jati Solid'),
  productionTime: Joi.string().trim().min(2).max(60).default('2 bulan'),
  image: Joi.string().allow('').optional(),
  images: Joi.array().items(photoItemSchema).min(1).max(6).required(),
  stockStatus: Joi.string().valid('Tersedia', 'Terjual').default('Tersedia'),
  featured: Joi.boolean().default(false),
});

export const productStockSchema = Joi.object({
  stockStatus: Joi.string().valid('Tersedia', 'Terjual').required(),
});

export const customPortfolioSchema = Joi.object({
  name: Joi.string().trim().min(2).max(160).required(),
  typeKey: Joi.string().trim().max(40).default('lainnya'),
  category: Joi.string().trim().min(2).max(60).required(),
  size: Joi.string().trim().min(2).max(120).required(),
  finish: Joi.string().trim().min(2).max(100).required(),
  city: Joi.string().trim().min(2).max(100).required(),
  year: Joi.string().trim().max(10).default('2026'),
  description: Joi.string().trim().min(5).max(1500).required(),
  image: Joi.string().allow('').optional(),
  images: Joi.array().items(photoItemSchema).min(1).max(6).required(),
  preset: Joi.object().unknown(true).optional(),
});

const ID_PHONE_PATTERN = /^(?:\+?62|0)8[1-9][0-9\s-]{7,15}$/;

export const orderCreateSchema = Joi.object({
  name: Joi.string().trim().min(2).max(120).required().messages({
    'string.empty': 'Nama pemesan wajib diisi.',
    'string.min': 'Nama pemesan minimal 2 huruf.',
  }),
  phone: Joi.string()
    .trim()
    .pattern(ID_PHONE_PATTERN)
    .required()
    .messages({
      'string.empty': 'Nomor WhatsApp aktif wajib diisi.',
      'any.required': 'Nomor WhatsApp aktif wajib diisi.',
      'string.pattern.base': 'Nomor WhatsApp tidak valid. Gunakan format HP Indonesia (contoh: 081234567890 atau +6281234567890).',
    }),
  address: Joi.string().trim().min(4).max(400).required().messages({
    'string.empty': 'Alamat pengiriman wajib diisi.',
    'string.min': 'Tuliskan kota dan alamat pengiriman lebih lengkap.',
  }),
  product: Joi.string().trim().min(2).max(200).required(),
  productId: Joi.number().integer().allow(null).optional(),
  quantity: Joi.number().integer().min(1).max(50).required(),
  payment: Joi.string().valid('Tunai', 'Tabung', 'Tunai / M-Banking', 'Sistem Tabung').required(),
  total: Joi.number().min(0).default(0),
  estimatedPrice: Joi.number().min(0).optional(),
  customerEmail: Joi.string().trim().email().allow('', null).optional(),
  latitude: Joi.number().min(-90).max(90).allow(null).optional(),
  longitude: Joi.number().min(-180).max(180).allow(null).optional(),
  agreedToTerms: Joi.boolean().valid(true).default(true).messages({
    'any.only': 'Anda harus menyetujui ketentuan konfirmasi WhatsApp sebelum mengirim pesanan.',
  }),
  custom: Joi.object().unknown(true).allow(null).optional(),
});

export const orderUpdateSchema = Joi.object({
  status: Joi.string()
    .valid(
      'Menunggu Harga Owner',
      'Harga Ditetapkan',
      'Menunggu Konfirmasi WA',
      'Baru',
      'Diproses',
      'Selesai',
      'Dibatalkan',
    )
    .optional(),
  finalPrice: Joi.number().min(0).allow(null).optional(),
  ownerNote: Joi.string().trim().allow('', null).max(500).optional(),
  madeBefore: Joi.boolean().optional(),
  madeNote: Joi.string().trim().allow('').max(500).optional(),
}).min(1);

export const saleCreateSchema = Joi.object({
  productId: Joi.number().integer().required(),
  quantity: Joi.number().integer().min(1).max(500).required(),
  date: Joi.string().trim().min(8).max(30).required(),
  note: Joi.string().trim().allow('').max(300).default(''),
  markSold: Joi.boolean().default(false),
});

export const faqSchema = Joi.object({
  title: Joi.string().trim().min(2).max(80).required(),
  question: Joi.string().trim().min(5).max(300).required(),
  answer: Joi.string().trim().min(5).max(2000).required(),
});

export const testimonialSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).required(),
  city: Joi.string().trim().min(2).max(100).required(),
  text: Joi.string().trim().min(5).max(600).required(),
});

export const chatRequestSchema = Joi.object({
  message: Joi.string().trim().min(1).max(1000).required().messages({
    'string.empty': 'Pesan tidak boleh kosong.',
    'any.required': 'Pesan wajib diisi.',
  }),
  activeProductId: Joi.number().integer().allow(null).optional(),
  sessionId: Joi.string().trim().max(120).optional(),
  logOnly: Joi.boolean().default(false),
  intent: Joi.string().trim().max(40).optional(),
});

export const viewMetricSchema = Joi.object({
  productId: Joi.number().integer().required(),
});

export function validate(schema) {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });
    if (error) {
      return res.status(400).json({
        success: false,
        code: 'VALIDATION_ERROR',
        message: 'Data yang dikirim tidak valid. Mohon periksa kembali isian formulir.',
        details: error.details.map((d) => ({
          field: d.path.join('.'),
          message: d.message,
        })),
      });
    }
    req.body = value;
    return next();
  };
}
