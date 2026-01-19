import { productRepository, customerRepository } from '@/lib/repositories';

export async function seedDummyData() {
  try {
    const pCount = await productRepository.count();
    if (pCount === 0) {
      await productRepository.create({ name: 'Coffee', default_price: 2.5, icon_uri: 'food' });
      await productRepository.create({ name: 'Bread', default_price: 1.5, icon_uri: 'misc' });
      await productRepository.create({ name: 'Milk', default_price: 3.0, icon_uri: 'drink' });
    }

    const cCount = await customerRepository.count();
    if (cCount === 0) {
      await customerRepository.create({ name: 'John Doe', phone: '1234567890' });
      await customerRepository.create({ name: 'Jane Smith', phone: '0987654321' });
    }
    
    console.log('Dummy data seeded successfully');
  } catch (err) {
    console.error('Failed to seed dummy data:', err);
  }
}
