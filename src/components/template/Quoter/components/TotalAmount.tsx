"use client";

import formatCurrency from "@/utils/formatCurrency";
import { Card, CardBody, Divider } from "@heroui/react";

interface TotalAmountProps {
  subtotal: number;
  discount: number;
  totalCalculate: number;
}

export function TotalAmount({
  subtotal,
  discount,
  totalCalculate,
}: TotalAmountProps) {
  const discountAmount = (subtotal * discount) / 100;

  return (
    <Card className="sticky top-4 bg-white dark:bg-gray-800/95 border border-gray-200 dark:border-gray-700 backdrop-blur-sm shadow-lg">
      <CardBody className="p-4">
        <div className="space-y-2">
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-600 dark:text-gray-400">Subtotal:</span>
            <span className="text-gray-900 dark:text-white font-medium">{formatCurrency(subtotal)}</span>
          </div>
          
          {discount > 0 && (
            <>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600 dark:text-gray-400">Descuento ({discount}%):</span>
                <span className="text-red-500 dark:text-red-400 font-medium">-{formatCurrency(discountAmount)}</span>
              </div>
              <Divider className="bg-gray-200 dark:bg-gray-700" />
            </>
          )}
          
          <div className="flex justify-between items-center pt-1">
            <span className="text-lg font-semibold text-gray-700 dark:text-gray-300">Total:</span>
            <span className="text-xl font-bold text-green-600 dark:text-green-400">{formatCurrency(totalCalculate)}</span>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}
