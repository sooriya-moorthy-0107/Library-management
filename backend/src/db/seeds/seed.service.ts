import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../entities/user.entity';
import { Book } from '../../entities/book.entity';
import { BookCopy } from '../../entities/copy.entity';
import { SystemSetting } from '../../entities/setting.entity';
import { Transaction } from '../../entities/transaction.entity';
import { BookRequest } from '../../entities/request.entity';
import { Fine } from '../../entities/fine.entity';
import { AuditLog } from '../../entities/audit-log.entity';

@Injectable()
export class SeedService implements OnApplicationBootstrap {
  constructor(
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    @InjectRepository(Book) private readonly bookRepo: Repository<Book>,
    @InjectRepository(BookCopy) private readonly copyRepo: Repository<BookCopy>,
    @InjectRepository(SystemSetting) private readonly settingRepo: Repository<SystemSetting>,
    @InjectRepository(Transaction) private readonly transactionRepo: Repository<Transaction>,
    @InjectRepository(BookRequest) private readonly requestRepo: Repository<BookRequest>,
    @InjectRepository(Fine) private readonly fineRepo: Repository<Fine>,
    @InjectRepository(AuditLog) private readonly auditLogRepo: Repository<AuditLog>,
  ) {}

  async onApplicationBootstrap() {
    const userCount = await this.userRepo.count();
    if (userCount > 0) {
      console.log('Database already has data. Skipping auto-seeding.');
      return;
    }

    console.log('Database is empty. Starting database seeding...');

    // 1. Seed Settings
    const settings = [
      { key: 'college_email_domain', value: 'college.edu.in', type: 'STRING', description: 'Allowed email domain' },
      { key: 'max_books_per_student', value: '3', type: 'INTEGER', description: 'Max simultaneous book holdings' },
      { key: 'default_loan_days', value: '14', type: 'INTEGER', description: 'Default borrowing duration' },
      { key: 'default_fine_per_day', value: '5.00', type: 'DECIMAL', description: 'Fine per overdue day in INR' },
      { key: 'grace_period_days', value: '0', type: 'INTEGER', description: 'Grace days before fines apply' },
      { key: 'max_renewals', value: '2', type: 'INTEGER', description: 'Max extensions allowed' },
      { key: 'renewal_window_days', value: '3', type: 'INTEGER', description: 'Days before due date window' },
      { key: 'mfa_required_roles', value: 'super_admin,admin,librarian', type: 'CSV', description: 'MFA mandated roles' },
      { key: 'session_timeout_minutes', value: '480', type: 'INTEGER', description: 'Idle session lockout' },
      { key: 'password_min_length', value: '10', type: 'INTEGER', description: 'Password length constraint' },
      { key: 'max_failed_logins', value: '5', type: 'INTEGER', description: 'Lockout threshold' },
      { key: 'dashboard_refresh_seconds', value: '60', type: 'INTEGER', description: 'Refresh rate' },
    ];
    await this.settingRepo.save(settings);
    console.log('Seeded system settings.');

    // 2. Seed Users
    // Hashed password matches "password123"
    const passHash = '$2b$12$K.zG8Gq51YfAIszBfV1z/u6O22wEpxKvxT7k8825.26U1jFp0y50m';

    const users = [
      { email: 'super@college.edu.in', passwordHash: passHash, fullName: 'Super Admin User', role: 'super_admin', isActive: true, preferredLanguage: 'en' },
      { email: 'elena@college.edu.in', passwordHash: passHash, fullName: 'Elena Vance', role: 'admin', isActive: true, preferredLanguage: 'en' },
      { email: 'john@college.edu.in', passwordHash: passHash, fullName: 'John Librarian', role: 'librarian', isActive: true, preferredLanguage: 'en' },
      { email: 'julian@college.edu.in', passwordHash: passHash, fullName: 'Dr. Julian Thorne', role: 'coordinator', departmentId: 'Neuroscience', isActive: true, preferredLanguage: 'en' },
      { email: 'sarah@college.edu.in', passwordHash: passHash, fullName: 'Sarah Jenkins', role: 'student', studentId: '2024-FAC-4592', phone: '+1 (555) 012-3456', isActive: true, preferredLanguage: 'en' },
      { email: 'liam@college.edu.in', passwordHash: passHash, fullName: 'Liam Zhao', role: 'student', studentId: '2024-STUD-8812', phone: '+1 (555) 888-9999', isActive: true, preferredLanguage: 'en' },
    ];
    const savedUsers = await this.userRepo.save(users) as User[];
    console.log('Seeded system users.');

    const adminUser = savedUsers.find(u => u.role === 'admin')!;
    const librarianUser = savedUsers.find(u => u.role === 'librarian')!;
    const studentSarah = savedUsers.find(u => u.email === 'sarah@college.edu.in')!;
    const studentLiam = savedUsers.find(u => u.email === 'liam@college.edu.in')!;

    // 3. Seed Books
    const books = [
      {
        isbn: '978-0071390119',
        title: 'Principles of Neural Science',
        authors: ['Eric R. Kandel', 'James H. Schwartz', 'Thomas M. Jessell'],
        publisher: 'McGraw-Hill',
        edition: '5th Edition',
        publicationYear: 2012,
        categoryId: 'Neuroscience',
        departmentId: 'Sciences',
        coverImageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA9ClW68hcl6oRxcHHKd-2BjBVK4wyHRUw2OGwjEbOMQffVN0OIrsfDrwVo1-_9e0FVS5sbFb_z-3V64giR7onzg9j-4RCjkWS2a18TjU1hNx-yDdRcQEbcjjzRUbojLUdIwmG0NLHenA6OEw_4v32MTUqcHSh3QLsx68socor9A_EoXUYMgDSFDoDEGxOFdR2H_EUQseda4zsL3Ti7HSgk9F9jh6aDhJ_w7N6J9vqieIbvhu3gZGSE269eefaPKuTnPsp_gvO3KnE',
        description: 'A comprehensive neuroscience text exploring cellular biology, synapes, and cognitive function.',
        finePerDay: 10.00,
        maxIssueDays: 21,
        replacementCost: 245.00,
        isDigitalAvailable: false,
        drmPolicy: 'BORROW_ONLY',
      },
      {
        isbn: '978-0198522300',
        title: 'Quantum Mechanics Vol. II',
        authors: ['Claude Cohen-Tannoudji'],
        publisher: 'Wiley',
        edition: '2nd Edition',
        publicationYear: 2005,
        categoryId: 'Physics',
        departmentId: 'Sciences',
        coverImageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDNQyNyYBIb-YLhbcUQ5nUyeQZHgP4vyoU2I1R_uMDgCpX6lpbiQ38iUl7RuPkfA-juDc_qAAUk2dGY1CyTM_KDwrAJoOOEpOWjv4JC5s5h-G0XLKiDWBzxTPHmbMZz42bXU7rO-oSsSZGL-3RHTVkGOLvzWdcnUwBX4u6QDIuclkHpmEfvFcRRuZIXNpa6jW35JdHdvGY7u9e-gm3S2sb911Ol5_CDZfoiZVqvZXhnmTpencJ4MRutQzfb6W5GDZ2GLalg_6AVqE8',
        description: 'Advanced quantum mechanisms textbook focusing on angular momentum and scattering theory.',
        finePerDay: 5.00,
        maxIssueDays: 14,
        replacementCost: 180.00,
        isDigitalAvailable: true,
        drmPolicy: 'BORROW_ONLY',
      },
      {
        isbn: '978-0806509820',
        title: 'Gray\'s Anatomy (Digital Edition)',
        authors: ['Henry Gray'],
        publisher: 'Bounty Books',
        edition: 'Deluxe Classic',
        publicationYear: 2021,
        categoryId: 'Medicine',
        departmentId: 'Sciences',
        coverImageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDM0ajqyag5JAui6bwX_-7K1Zc7R2NFmsWMhnFrfje1c6oSYMyVj1OfpH5NzxTAwyJrXhht5YQDSsKmC8C2WnKc5VOM3hUcccYXfvRQhTEZ4WudalTcDOBZWiLNHF9GwSlMoXLXwbkHpwyWkLTGDjBc6zdQgG_4FKMy4QZjwM2Qa5nZ6uDvIBLJKHFjMMn1nCozfNZviQRoak46VzbGDG5b8I4QpZyaEbrK9KDLlRk6zPanOvJo27o8Uqq6ff6Qm1cj9lZkHgr2hh8',
        description: 'The standard anatomy classic, fully updated in digital version.',
        finePerDay: 5.00,
        maxIssueDays: 14,
        replacementCost: 95.00,
        isDigitalAvailable: true,
        drmPolicy: 'OPEN',
      },
      {
        isbn: '978-0262033848',
        title: 'Modern Grid Systems',
        authors: ['Josef Müller-Brockmann'],
        publisher: 'MIT Press',
        edition: 'Revised 3rd Edition',
        publicationYear: 1996,
        categoryId: 'Design',
        departmentId: 'Sciences',
        coverImageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDqPPMRki3tODOVYCQfgRiIHz7jHPlchwi6MJPKVE2cNs5npr-qGa5OmWTqRuikk59lUkFVtHJI-EHRczDbrxvkd3AOGAAI6s7z5CX34FdI_tFFNecS-v4VAgv74TeEcLHzj6fyBMOq1Z2yVOLHaR2wrYPgyq9-TlLqifcjI3jgTq8j4nSVJbMB2X3cmlruGWmLn9fDYpgB7W9YypbCIofBJ7HXFlfg8v88g68DrnGyYwLbTEAwSsnuE8utCevRwkUJCTaF8uDYx70',
        description: 'The design guide defining column grid usage in digital and print mediums.',
        finePerDay: 5.00,
        maxIssueDays: 14,
        replacementCost: 120.00,
        isDigitalAvailable: true,
        drmPolicy: 'BORROW_ONLY',
      },
      {
        isbn: '978-0374102941',
        title: 'Behavioral Economics 101',
        authors: ['Daniel Kahneman'],
        publisher: 'Farrar, Straus and Giroux',
        edition: '1st Edition',
        publicationYear: 2011,
        categoryId: 'Economics',
        departmentId: 'Humanities',
        coverImageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCc8UuETt-SGWZt4apmRIVgN9jb7UQeBJbtgFK5PsagUWpeYH7XpW2Y2IvEdCLdDtKVQoy56xd8EZzKQc8qkBb1DxsS2NAUnxx_s4EatMH0N64ztVzbp5yuv1ie1Hc1IrU9BH918L6Xa_Fon3ZVrTIexrcdUZvEtyQgV7Fo-5-opDhI2Cu3cYO1gsJS29oGa-A2wCitKV3BYbMlD3exgpBVvfWvsT4tndwlx5H0q1Y277BvpMncqal-2d-IvcXucDS1dRVmlJ4wtjc',
        description: 'Explore the cognitive biases impacting financial decisions.',
        finePerDay: 5.00,
        maxIssueDays: 14,
        replacementCost: 85.00,
        isDigitalAvailable: false,
        drmPolicy: 'BORROW_ONLY',
      },
      {
        isbn: '978-0140283334',
        title: 'History of Renaissance Art',
        authors: ['Giorgio Vasari'],
        publisher: 'Penguin Classics',
        edition: 'Revised Edition',
        publicationYear: 1998,
        categoryId: 'Art History',
        departmentId: 'Humanities',
        coverImageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCctQPrQoMeMdc9Rs3vTBZdiAKXtukSFYb5BcHl-d_j_8KBlkpbOEyh_XJdpTItNu7fI6wPvAVYGqgalN2Vblk9ifBlY78p5Aks_lndYxG9PoN7N-DoPEg46ys95YANnV6q64Ber1bfvZkF6u4kiCGPrb-Otw4B6japwFseLQEKCMUMLgEBlE0FJ12cHwui1jlM7YnPMb4zE4Ni4zgWIuEOME-CgEvQsYpMSuGOyrq0ZmgOjRHliOcKCoDXrBvdYbHSmZtI0NXOhmw',
        description: 'A comprehensive detailing of classic Renaissance artists and styles.',
        finePerDay: 5.00,
        maxIssueDays: 14,
        replacementCost: 75.00,
        isDigitalAvailable: false,
        drmPolicy: 'BORROW_ONLY',
      },
    ];
    const savedBooks = await this.bookRepo.save(books);
    console.log('Seeded catalog books.');

    const bookNeural = savedBooks.find(b => b.isbn === '978-0071390119')!;
    const bookQuantum = savedBooks.find(b => b.isbn === '978-0198522300')!;
    const bookAnatomy = savedBooks.find(b => b.isbn === '978-0806509820')!;
    const bookGrid = savedBooks.find(b => b.isbn === '978-0262033848')!;
    const bookEcon = savedBooks.find(b => b.isbn === '978-0374102941')!;
    const bookArt = savedBooks.find(b => b.isbn === '978-0140283334')!;

    // 4. Seed Copies
    const copies = [
      { bookId: bookNeural.id, copyNumber: 'COP-1', barcode: 'LUM-9928-QX', condition: 'GOOD', locationShelf: '4B', locationRack: '1', status: 'AVAILABLE', acquiredDate: new Date() },
      { bookId: bookNeural.id, copyNumber: 'COP-2', barcode: 'LUM-9928-QY', condition: 'GOOD', locationShelf: '4B', locationRack: '1', status: 'AVAILABLE', acquiredDate: new Date() },
      { bookId: bookNeural.id, copyNumber: 'COP-3', barcode: 'LUM-9928-QZ', condition: 'FAIR', locationShelf: '4B', locationRack: '2', status: 'AVAILABLE', acquiredDate: new Date() },

      { bookId: bookQuantum.id, copyNumber: 'COP-1', barcode: 'LUM-1102-QA', condition: 'GOOD', locationShelf: '2C', locationRack: '2', status: 'AVAILABLE', acquiredDate: new Date() },
      { bookId: bookQuantum.id, copyNumber: 'COP-2', barcode: 'LUM-1102-QB', condition: 'GOOD', locationShelf: '2C', locationRack: '2', status: 'AVAILABLE', acquiredDate: new Date() },
      
      { bookId: bookAnatomy.id, copyNumber: 'COP-D1', barcode: 'DL-8820-DIGI', condition: 'GOOD', locationShelf: 'Cloud', locationRack: 'Cloud', status: 'AVAILABLE', acquiredDate: new Date() },
      
      { bookId: bookGrid.id, copyNumber: 'COP-1', barcode: 'LUM-4451-BC', condition: 'GOOD', locationShelf: '3A', locationRack: '1', status: 'AVAILABLE', acquiredDate: new Date() },
      { bookId: bookGrid.id, copyNumber: 'COP-2', barcode: 'LUM-4451-BD', condition: 'FAIR', locationShelf: '3A', locationRack: '1', status: 'AVAILABLE', acquiredDate: new Date() },

      { bookId: bookEcon.id, copyNumber: 'COP-1', barcode: 'LUM-1029-LT', condition: 'GOOD', locationShelf: '3C', locationRack: '4', status: 'AVAILABLE', acquiredDate: new Date() },
      
      { bookId: bookArt.id, copyNumber: 'COP-1', barcode: 'LUM-5060-AR', condition: 'GOOD', locationShelf: '5A', locationRack: '2', status: 'AVAILABLE', acquiredDate: new Date() },
    ];
    const savedCopies = await this.copyRepo.save(copies);
    console.log('Seeded physical and digital book copies.');

    // 5. Seed Transactions (Loans)
    // Sarah Jenkins has Grid System (LUM-4451-BC) issued, and Quantum (LUM-1102-QA) overdue
    const copyGrid = savedCopies.find(c => c.barcode === 'LUM-4451-BC')!;
    const copyQuantum = savedCopies.find(c => c.barcode === 'LUM-1102-QA')!;
    const copyArt = savedCopies.find(c => c.barcode === 'LUM-5060-AR')!;

    const today = new Date();
    const tenDaysAgo = new Date(today.getTime() - 10 * 24 * 60 * 60 * 1000);
    const fourDaysAgo = new Date(today.getTime() - 4 * 24 * 60 * 60 * 1000);
    const fourDaysFromNow = new Date(today.getTime() + 4 * 24 * 60 * 60 * 1000);
    const tenDaysFromNow = new Date(today.getTime() + 10 * 24 * 60 * 60 * 1000);

    const txns = [
      {
        copyId: copyGrid.id,
        userId: studentSarah.id,
        issuedById: librarianUser.id,
        issuedAt: tenDaysAgo,
        dueAt: tenDaysFromNow,
        renewedCount: 0,
        status: 'ACTIVE',
      },
      {
        copyId: copyQuantum.id,
        userId: studentSarah.id,
        issuedById: librarianUser.id,
        issuedAt: tenDaysAgo,
        dueAt: fourDaysAgo, // OVERDUE
        renewedCount: 0,
        status: 'OVERDUE',
      },
      {
        copyId: copyArt.id,
        userId: studentLiam.id,
        issuedById: librarianUser.id,
        issuedAt: tenDaysAgo,
        dueAt: today, // DUE TODAY
        renewedCount: 0,
        status: 'ACTIVE',
      }
    ];
    const savedTxns = await this.transactionRepo.save(txns);

    // Update copy statuses to ISSUED
    await this.copyRepo.update(copyGrid.id, { status: 'ISSUED' });
    await this.copyRepo.update(copyQuantum.id, { status: 'ISSUED' });
    await this.copyRepo.update(copyArt.id, { status: 'ISSUED' });
    console.log('Seeded borrowing transactions.');

    // 6. Seed Fines
    // Sarah has a fine of 20 INR (4 days overdue * 5 INR/day) for Quantum Mechanics
    const fineTxn = savedTxns.find(t => t.copyId === copyQuantum.id)!;
    const fine = {
      transactionId: fineTxn.id,
      userId: studentSarah.id,
      fineType: 'OVERDUE',
      amount: 20.00,
      waivedAmount: 0.00,
      status: 'UNPAID',
    };
    await this.fineRepo.save(fine);
    console.log('Seeded overdue fines.');

    // 7. Seed Requests
    // Julian Thorne requested Neural Science book
    const request = {
      bookId: bookNeural.id,
      userId: studentSarah.id,
      status: 'PENDING_COORDINATOR',
      purpose: 'Term project on hippocampal synapses research under Dr. Julian Thorne.',
    };
    await this.requestRepo.save(request);
    console.log('Seeded pending book requests.');

    // 8. Seed Audit Logs
    const auditLogs = [
      { actorId: adminUser.id, action: 'SYSTEM_BOOT', entityType: 'System', entityId: adminUser.id, newValue: JSON.stringify({ event: 'System initialized' }) },
      { actorId: librarianUser.id, action: 'BOOK_ISSUED', entityType: 'Transaction', entityId: savedTxns[0].id, newValue: JSON.stringify({ barcode: 'LUM-4451-BC', borrower: 'Sarah Jenkins' }) },
      { actorId: librarianUser.id, action: 'BOOK_ISSUED', entityType: 'Transaction', entityId: savedTxns[1].id, newValue: JSON.stringify({ barcode: 'LUM-1102-QA', borrower: 'Sarah Jenkins' }) },
    ];
    await this.auditLogRepo.save(auditLogs);
    console.log('Seeded audit logs.');

    console.log('Database seeding successfully completed! Ready for usage.');
  }
}
