"use client";
import { Quoter } from "@/entities/Quoter";
import formatCurrency from "@/utils/formatCurrency";
import { Button } from "@heroui/react";
import {
  EyeIcon,
  ClockIcon,
  ArrowTopRightOnSquareIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";
import { Modal, ModalContent, ModalHeader, ModalBody } from "@heroui/react";
import { useState } from "react";
import { ModalData } from "@/types";
import ModalDetailQuoter from "./ModalDetailQuoter";

interface ICardQuotersProps {
  quoter: Quoter;
}

export default function CardQuoters({ quoter }: ICardQuotersProps) {
  const [modalData, setModalData] = useState<ModalData>({
    title: "Producto",
    size: "md",
  });
  const [showModal, setShowModal] = useState(false);
  const formattedDate = new Date(quoter.dateLimit).toLocaleDateString("es-ES", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const showDetailQuoter = (quoter: Quoter) => {
    setShowModal(true);
    setModalData({
      title: "Detalles de la cotización",
      size: "3xl",
      content: <ModalDetailQuoter quoter={quoter} />,
    });
  };

  return (
    <div className="flex p-6 rounded-lg bg-gray-800 border border-gray-700 w-full transition-all hover:bg-gray-700">
      <div className="flex flex-col w-full space-y-4">
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <p className="text-white font-semibold text-lg">{quoter.artist}</p>
            <div className="flex items-center text-gray-400 text-sm">
              <ClockIcon className="w-4 h-4 mr-1" />
              <span>Fecha límite: {formattedDate}</span>
            </div>
          </div>
          <p className="text-white font-semibold text-xl">
            {formatCurrency(quoter.totalAmount)}
          </p>
        </div>
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <span
              className={`px-2 py-1 rounded-full text-xs font-medium ${
                quoter.status === "PENDIENTE"
                  ? "bg-yellow-500/10 text-yellow-500"
                  : "bg-blue-500/10 text-blue-500"
              }`}
            >
              {quoter.status === "PENDIENTE" ? "Pendiente" : "En proceso"}
            </span>
            {quoter.products && (
              <span className="text-gray-400 text-sm">
                {quoter.products.length} producto
                {quoter.products.length !== 1 ? "s" : ""}
              </span>
            )}
          </div>
          <Button
            variant="bordered"
            className="inline-flex items-center space-x-2 text-white hover:text-gray-200"
            onPress={() => showDetailQuoter(quoter)}
          >
            <EyeIcon className="w-4 h-4" />
            <span>Ver detalles</span>
          </Button>
        </div>
      </div>
      <Modal
        size={modalData.size as any}
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setModalData({ ...modalData, content: null });
        }}
        scrollBehavior="inside"
      >
        <ModalContent>
          <ModalHeader className="flex gap-1">
            {modalData.title ?? ""}
            {modalData.link && (
              <Link
                href={modalData.link}
                target="_blank"
                className="font-medium text-primary hover:underline"
              >
                <ArrowTopRightOnSquareIcon
                  width="24"
                  height="24"
                  className="mb-1 ml-2 inline"
                />
              </Link>
            )}
          </ModalHeader>
          <ModalBody>
            {modalData.content ?? ""}
          </ModalBody>
        </ModalContent>
      </Modal>
    </div>
  );
}
