import csvParse from 'csv-parser';
import fs from 'fs';
import path from 'path';
import { getRepository, getCustomRepository, In } from 'typeorm';

import uploadConfig from '../config/upload';

import Transaction from '../models/Transaction';
import Category from '../models/Category';
import TransactionsRepository from '../repositories/TransactionsRepository';

interface Request {
  transactionsFilename: string;
}

interface CSVTransaction {
  title: string;
  type: 'income' | 'outcome';
  value: number;
  category: string;
}

class ImportTransactionsService {
  private async loadCSV(filePath: string): Promise<CSVTransaction[]> {
    const readCSVStream = fs.createReadStream(filePath);

    const parseStream = csvParse({
      mapValues: ({ value }) => value.trim(),
      mapHeaders: ({ header }) => header.trim(),
    });

    const parseCSV = readCSVStream.pipe(parseStream);

    const transactions: CSVTransaction[] = [];

    parseCSV.on('data', line => {
      transactions.push(line);
    });

    await new Promise(resolve => {
      parseCSV.on('end', resolve);
    });

    return transactions;
  }

  async execute({ transactionsFilename }: Request): Promise<Transaction[]> {
    const transactionsFilePath = path.join(
      uploadConfig.folder,
      transactionsFilename,
    );

    const importedTransactions = await this.loadCSV(transactionsFilePath);

    const uniqueCSVCategories = importedTransactions
      .map(transaction => transaction.category)
      .filter((value, index, self) => self.indexOf(value) === index);

    const categoriesRepository = getRepository(Category);

    const existingCategories = await categoriesRepository.find({
      where: { title: In(uniqueCSVCategories) },
    });

    const existingCategoriesTitle = existingCategories.map(
      (category: Category) => category.title,
    );

    const categoriesToAdd = uniqueCSVCategories.filter(
      category => !existingCategoriesTitle.includes(category),
    );

    const newCategories = categoriesRepository.create(
      categoriesToAdd.map(title => ({ title })),
    );

    categoriesRepository.save(newCategories);

    await fs.promises.unlink(transactionsFilePath);

    const databaseCategories = [...existingCategories, ...newCategories];

    const transactionsRepository = getCustomRepository(TransactionsRepository);

    const transactions = transactionsRepository.create(
      importedTransactions.map(transaction => ({
        title: transaction.title,
        type: transaction.type,
        value: transaction.value,
        category: databaseCategories.find(
          category => category.title === transaction.category,
        ),
      })),
    );

    await transactionsRepository.save(transactions);

    return transactions;
  }
}

export default ImportTransactionsService;
