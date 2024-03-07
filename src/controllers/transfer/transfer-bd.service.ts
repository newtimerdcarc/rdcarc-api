/* eslint-disable prettier/prettier */
import { Inject, Injectable } from '@nestjs/common';
@Injectable()
export class TransferBdService {
    constructor(
        @Inject('TRANSFERS') private readonly transfeRepository: any
    ) { }

    async findAll(): Promise<any[]> {
        const query = `
            SELECT * FROM Transfers
            WHERE dirUUIDs <> 0 -- Filtrar registros com dirUUIDs diferente de 0
            ORDER BY completed_at DESC; -- Ordenar os resultados de forma decrescente com base no campo completed_at
        `;
        const transfers = await this.transfeRepository.query(query);

        transfers.sort((a, b) => {
            // Transfers com status < 2 no topo
            if (a.status < 2 && b.status >= 2) {
                return -1;
            } else if (a.status >= 2 && b.status < 2) {
                return 1;
            } else {
                return 0;
            }
        });

        // Extrair o título para os transfers com currentLocation
        for (const transfer of transfers) {
            if (transfer.currentLocation) {
                transfer.title = this.extrairNome(transfer.currentLocation);
            }
        }

        return transfers;
    }

    private extrairNome(str: string): string {
        const partes = str.split('/');
        const penultimaParte = partes[partes.length - 2];
        const partesNome = penultimaParte.split('-');
        return partesNome[0];
    }

}